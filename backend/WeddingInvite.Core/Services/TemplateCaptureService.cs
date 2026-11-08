using System.Buffers.Binary;
using System.Security.Cryptography;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using WeddingInvite.Core.DTOs;
using WeddingInvite.Core.Utilities;
using WeddingInvite.Data;
using WeddingInvite.Models;

namespace WeddingInvite.Core.Services;

public class CaptureUnavailableException(string message = "Thumbnail capture is currently unavailable. Please try again shortly.") : Exception(message);
public record CaptureJobDto(Guid Id, int TemplateId, string Status, string? Error, DateTime ExpiresAt, int? PublishedRevision);
public record CapturePreviewSnapshot(JsonElement Payload, int Width, int Height, double ScrollX = 0, double ScrollY = 0);
public record CaptureLeaseDto(Guid Id, string TemplateCode, string LeaseToken, int Width = 390, int Height = 700, CapturePreviewSnapshot? Snapshot = null);

public class CaptureWorkerPresence
{
    private long lastSeen;
    public void Touch(DateTime now) => Interlocked.Exchange(ref lastSeen, now.Ticks);
    public bool Available(DateTime now) => now.Ticks - Interlocked.Read(ref lastSeen) < TimeSpan.FromSeconds(30).Ticks;
}

public class TemplateCaptureService(AppDbContext db, TemplateStudioService studio, ITemplateService templates,
    IWebHostEnvironment environment, IConfiguration configuration, CaptureWorkerPresence presence,
    ILogger<TemplateCaptureService> logger, TimeProvider? clock = null)
{
    private DateTime Now => (clock ?? TimeProvider.System).GetUtcNow().UtcDateTime;
    private string Folder => Path.Combine(environment.ContentRootPath, ".template-captures");
    private string ImagePath(Guid id) => Path.Combine(Folder, id.ToString("N") + ".png");
    private static bool Active(string status) => status is "pending" or "processing" or "ready";
    private static CaptureJobDto Dto(TemplateCaptureJob job) => new(job.Id, job.TemplateId, job.Status, job.Error, job.ExpiresAt, job.PublishedRevision);
    public void Heartbeat() => presence.Touch(Now);

    private async Task<TemplateCaptureJob> Owned(int templateId, Guid id, string owner)
    {
        var job = await db.TemplateCaptureJobs.SingleOrDefaultAsync(x => x.Id == id && x.TemplateId == templateId && x.OwnerEmail == owner)
            ?? throw new KeyNotFoundException("Capture not found.");
        if (Active(job.Status) && job.ExpiresAt <= Now)
        {
            job.Status = "failed";
            job.Error = "This capture expired. Please retake it.";
            job.Version++;
            await db.SaveChangesAsync();
            DeleteImage(id);
        }
        return job;
    }

    public async Task<CaptureJobDto> StartAsync(int templateId, string owner, CapturePreviewSnapshot? snapshot = null)
    {
        if ((configuration["TemplateCapture:WorkerKey"]?.Length ?? 0) < 32)
            throw new CaptureUnavailableException("Thumbnail capture is not configured on this server. Start the local capture launcher, then retry.");
        if (!presence.Available(Now))
            throw new CaptureUnavailableException("The thumbnail renderer is not connected. Start the capture launcher and wait for it to connect, then retry.");
        var state = await studio.GetAsync(templateId);
        if (snapshot?.Payload.ValueKind == JsonValueKind.Undefined) snapshot = null;
        if (snapshot != null)
        {
            if (snapshot.Width is < 200 or > 2400 || snapshot.Height is < 200 or > 2400 ||
                !double.IsFinite(snapshot.ScrollX) || !double.IsFinite(snapshot.ScrollY) || snapshot.ScrollX < 0 || snapshot.ScrollY < 0 ||
                snapshot.ScrollX > 500_000 || snapshot.ScrollY > 500_000 || snapshot.Payload.ValueKind != JsonValueKind.Object ||
                snapshot.Payload.GetRawText().Length > 4_000_000 ||
                !snapshot.Payload.TryGetProperty("wedding", out var wedding) || wedding.ValueKind != JsonValueKind.Object ||
                !wedding.TryGetProperty("templateId", out var id) || id.ValueKind != JsonValueKind.Number || !id.TryGetInt32(out var selectedTemplate) || selectedTemplate != templateId)
                throw new ArgumentException("The current preview could not be captured. Reload the preview and retry.");
        }
        var snapshotJson = snapshot == null ? null : JsonSerializer.Serialize(snapshot);
        var existing = await db.TemplateCaptureJobs.Where(x => x.TemplateId == templateId && x.OwnerEmail == owner &&
            (x.Status == "pending" || x.Status == "processing" || x.Status == "ready")).FirstOrDefaultAsync();
        if (existing != null)
        {
            await Owned(templateId, existing.Id, owner);
            if (Active(existing.Status) && existing.PublishedDesignHash == state.PublishedDesignHash && existing.PreviewSnapshotJson == snapshotJson) return Dto(existing);
            existing.Status = "cancelled"; existing.Version++;
            await db.SaveChangesAsync(); DeleteImage(existing.Id);
        }
        var published = await db.TemplateStudioRevisions.Where(x => x.TemplateId == templateId).OrderByDescending(x => x.Revision).FirstOrDefaultAsync();
        int? revision = published != null && TemplateStudioService.Fingerprint(JsonSerializer.Deserialize<Dictionary<string, string>>(published.ConfigJson)!) == state.PublishedDesignHash
            ? published.Revision : null;
        var job = new TemplateCaptureJob { TemplateId = templateId, OwnerEmail = owner,
            PublishedDesignHash = state.PublishedDesignHash, PublishedRevision = revision, PreviewSnapshotJson = snapshotJson,
            CreatedDate = Now, ExpiresAt = Now.AddMinutes(2) };
        db.TemplateCaptureJobs.Add(job);
        await db.SaveChangesAsync();
        return Dto(job);
    }

    public async Task<CaptureJobDto> GetAsync(int templateId, Guid id, string owner) => Dto(await Owned(templateId, id, owner));

    public async Task<byte[]> GetImageAsync(int templateId, Guid id, string owner)
    {
        var job = await Owned(templateId, id, owner);
        if (job.Status != "ready" || !File.Exists(ImagePath(id))) throw new KeyNotFoundException("Capture image is not available. Please retake it.");
        return await File.ReadAllBytesAsync(ImagePath(id));
    }

    public async Task CancelAsync(int templateId, Guid id, string owner)
    {
        var job = await Owned(templateId, id, owner);
        if (job.Status == "applied") return;
        job.Status = "cancelled"; job.Version++;
        await db.SaveChangesAsync(); DeleteImage(id);
    }

    public async Task<CaptureLeaseDto?> ClaimAsync()
    {
        presence.Touch(Now);
        var job = await db.TemplateCaptureJobs.AsNoTracking().Where(x => x.Status == "pending" && x.ExpiresAt > Now)
            .OrderBy(x => x.CreatedDate).FirstOrDefaultAsync();
        if (job == null) return null;
        var token = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
        var changed = await db.TemplateCaptureJobs.Where(x => x.Id == job.Id && x.Status == "pending" && x.ExpiresAt > Now)
            .ExecuteUpdateAsync(s => s.SetProperty(x => x.Status, "processing").SetProperty(x => x.LeaseToken, token)
                .SetProperty(x => x.ExpiresAt, Now.AddMinutes(2)).SetProperty(x => x.Version, x => x.Version + 1));
        if (changed == 0) return null;
        var tracked = db.ChangeTracker.Entries<TemplateCaptureJob>().FirstOrDefault(x => x.Entity.Id == job.Id);
        if (tracked != null) await tracked.ReloadAsync();
        var template = await db.Templates.FindAsync(job.TemplateId) ?? throw new KeyNotFoundException("Template not found.");
        var snapshot = job.PreviewSnapshotJson == null ? null : JsonSerializer.Deserialize<CapturePreviewSnapshot>(job.PreviewSnapshotJson);
        return new(job.Id, template.TemplateCode, token, snapshot?.Width ?? 390, snapshot?.Height ?? 700, snapshot);
    }

    private async Task<TemplateCaptureJob> Leased(Guid id, string token)
    {
        var job = await db.TemplateCaptureJobs.FindAsync(id) ?? throw new KeyNotFoundException("Capture not found.");
        if (job.Status != "processing" || job.ExpiresAt <= Now || token.Length != 64 || job.LeaseToken == null ||
            !CryptographicOperations.FixedTimeEquals(System.Text.Encoding.UTF8.GetBytes(token), System.Text.Encoding.UTF8.GetBytes(job.LeaseToken)))
            throw new InvalidOperationException("Capture lease is no longer valid.");
        return job;
    }

    public async Task CompleteAsync(Guid id, string leaseToken, IFormFile file)
    {
        var job = await Leased(id, leaseToken);
        if (file.Length > 8 * 1024 * 1024 || file.Length < 24 || !FileSignatureValidator.IsValidImage(file, ".png"))
            throw new ArgumentException("Capture must be a PNG under 8 MB.");
        var header = new byte[24];
        await using (var stream = file.OpenReadStream()) await stream.ReadExactlyAsync(header);
        var snapshot = job.PreviewSnapshotJson == null ? null : JsonSerializer.Deserialize<CapturePreviewSnapshot>(job.PreviewSnapshotJson);
        if (BinaryPrimitives.ReadUInt32BigEndian(header.AsSpan(16, 4)) != (snapshot?.Width ?? 390) || BinaryPrimitives.ReadUInt32BigEndian(header.AsSpan(20, 4)) != (snapshot?.Height ?? 700))
            throw new ArgumentException("Capture dimensions do not match the preview.");
        var state = await studio.GetAsync(job.TemplateId);
        if (state.PublishedDesignHash != job.PublishedDesignHash)
        {
            job.Status = "failed"; job.Error = "The published design changed during capture. Please retake it."; job.Version++;
            await db.SaveChangesAsync(); return;
        }
        // Consume this upload lease atomically before writing its private file. A duplicate
        // callback must not overwrite (or delete on a concurrency failure) a ready capture.
        var reservedVersion = job.Version + 1;
        var reserved = await db.TemplateCaptureJobs.Where(x => x.Id == id && x.Status == "processing" &&
            x.Version == job.Version && x.LeaseToken == leaseToken).ExecuteUpdateAsync(s => s
                .SetProperty(x => x.LeaseToken, (string?)null).SetProperty(x => x.Version, reservedVersion));
        if (reserved == 0) throw new InvalidOperationException("This capture upload was already consumed or cancelled.");
        job.LeaseToken = null;
        job.Version = reservedVersion;
        db.Entry(job).Property(x => x.Version).OriginalValue = reservedVersion;
        Directory.CreateDirectory(Folder);
        var temporary = ImagePath(id) + ".tmp";
        try
        {
            await using (var output = File.Create(temporary)) await file.CopyToAsync(output);
            File.Move(temporary, ImagePath(id), overwrite: true);
            job.Status = "ready"; job.ExpiresAt = Now.AddMinutes(10); job.LeaseToken = null; job.Version++;
            await db.SaveChangesAsync();
        }
        catch
        {
            DeleteImage(id);
            await db.TemplateCaptureJobs.Where(x => x.Id == id && x.Status == "processing" && x.Version == reservedVersion)
                .ExecuteUpdateAsync(s => s.SetProperty(x => x.Status, "failed").SetProperty(x => x.Error, "The preview could not be saved. Please retry.").SetProperty(x => x.Version, x => x.Version + 1));
            throw;
        }
        finally { if (File.Exists(temporary)) File.Delete(temporary); }
    }

    public async Task FailAsync(Guid id, string leaseToken)
    {
        var job = await Leased(id, leaseToken);
        job.Status = "failed"; job.Error = "The preview could not be captured. Please retry."; job.LeaseToken = null; job.Version++;
        await db.SaveChangesAsync(); DeleteImage(id);
    }

    public async Task<TemplateDto> ApplyAsync(int templateId, Guid id, string owner)
    {
        await using var tx = await db.Database.BeginTransactionAsync();
        var job = await Owned(templateId, id, owner);
        if (job.Status != "ready" || !File.Exists(ImagePath(id))) throw new InvalidOperationException(job.Error ?? "This capture is not ready. Please retake it.");
        if ((await studio.GetAsync(templateId)).PublishedDesignHash != job.PublishedDesignHash)
            throw new InvalidOperationException("A newer design has been published. Retake the thumbnail before saving.");
        await using var image = File.OpenRead(ImagePath(id));
        var file = new FormFile(image, 0, image.Length, "file", "capture.png") { Headers = new HeaderDictionary(), ContentType = "image/png" };
        // Keep the old uploaded image so a transaction rollback cannot invalidate its URL.
        var template = await templates.SetThumbnailAsync(templateId, file, preservePrevious: true);
        job.Status = "applied"; job.Version++;
        await db.SaveChangesAsync(); await tx.CommitAsync();
        DeleteImage(id);
        return template;
    }

    public async Task CleanupAsync()
    {
        var expired = await db.TemplateCaptureJobs.Where(x => x.ExpiresAt <= Now &&
            (x.Status == "pending" || x.Status == "processing" || x.Status == "ready")).ToListAsync();
        foreach (var job in expired)
        {
            job.Status = "failed"; job.Error = "This capture expired. Please retake it."; job.Version++;
            DeleteImage(job.Id);
        }
        await db.SaveChangesAsync();
        var cutoff = Now.AddDays(-1);
        await db.TemplateCaptureJobs.Where(x => x.CreatedDate < cutoff && x.Status != "pending" && x.Status != "processing" && x.Status != "ready").ExecuteDeleteAsync();
        if (Directory.Exists(Folder))
            foreach (var file in Directory.EnumerateFiles(Folder).Where(x => File.GetLastWriteTimeUtc(x) < cutoff))
                try { File.Delete(file); } catch (Exception e) when (e is IOException or UnauthorizedAccessException) { logger.LogWarning(e, "Could not remove an expired capture file"); }
    }

    private void DeleteImage(Guid id)
    {
        try { File.Delete(ImagePath(id)); }
        catch (Exception e) when (e is IOException or UnauthorizedAccessException) { logger.LogWarning(e, "Could not remove capture {CaptureId}", id); }
    }
}
