using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using WeddingInvite.Core.DTOs;
using Microsoft.EntityFrameworkCore;
using WeddingInvite.Core.Config;
using WeddingInvite.Data;
using WeddingInvite.Models;

namespace WeddingInvite.Core.Services;

public record StudioRevisionDto(int Revision, DateTime PublishedDate);
public record StudioStateDto(int TemplateId, int Version, Dictionary<string, string> Config,
    JsonElement Sample, DateTime? UpdatedDate, List<StudioRevisionDto> Revisions, string PublishedDesignHash);
public record StudioSaveDto(int Version, Dictionary<string, string> Config, JsonElement Sample);
public record StudioVersionDto(int Version);
public record StudioRestoreDto(int Version, int Revision);

public class TemplateStudioService(AppDbContext db, ITemplateConfigService configService, IWebHostEnvironment? environment = null)
{
    private static Dictionary<string, string> Parse(string json) =>
        JsonSerializer.Deserialize<Dictionary<string, string>>(json) ?? new();
    internal static string Fingerprint(Dictionary<string, string> config) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(
            JsonSerializer.Serialize(config.OrderBy(x => x.Key, StringComparer.Ordinal)))));

    private async Task EnsureTemplate(int id)
    {
        var template = await db.Templates.FindAsync(id) ?? throw new KeyNotFoundException("Template not found.");
        // Authored composition editing stays in authoring until its draft/publish path is integrated.
        if (template.IsAuthored) throw new ArgumentException("Use Template authoring for authored compositions. Studio currently edits code-built templates.");
    }

    public async Task<StudioStateDto> GetAsync(int id)
    {
        await EnsureTemplate(id);
        var draft = await db.TemplateStudioDrafts.FindAsync(id);
        var revisions = await db.TemplateStudioRevisions.Where(x => x.TemplateId == id)
            .OrderByDescending(x => x.Revision).Select(x => new StudioRevisionDto(x.Revision, x.PublishedDate)).ToListAsync();
        return new(id, draft?.Version ?? 0,
            draft == null ? await configService.GetDefaultAsync(id) : Parse(draft.ConfigJson),
            JsonSerializer.Deserialize<JsonElement>(draft?.SampleJson ?? "{}"), draft?.UpdatedDate, revisions,
            Fingerprint(await configService.GetDefaultAsync(id)));
    }

    public async Task<TemplateDto> SetThumbnailAsync(int id, int version, string publishedDesignHash,
        IFormFile file, ITemplateService templates)
    {
        await using var transaction = await db.Database.BeginTransactionAsync();
        var state = await GetAsync(id);
        if (state.Version != version || state.PublishedDesignHash != publishedDesignHash)
            throw new InvalidOperationException("The published design or workspace changed during capture. Capture a fresh thumbnail.");
        var result = await templates.SetThumbnailAsync(id, file);
        await transaction.CommitAsync();
        return result;
    }

    public async Task<StudioStateDto> SaveAsync(int id, StudioSaveDto request)
    {
        await EnsureTemplate(id);
        if (request.Config == null || request.Config.Count > 2000 || request.Config.Any(x =>
            string.IsNullOrWhiteSpace(x.Key) || x.Key.Length > 240 || x.Value == null || x.Value.Length > 1_000_000))
            throw new ArgumentException("Invalid design configuration.");
        if (request.Sample.ValueKind != JsonValueKind.Object || request.Sample.GetRawText().Length > 200_000)
            throw new ArgumentException("Sample content must be a JSON object under 200 KB.");
        ValidateLayoutJson(request.Config);
        var draft = await db.TemplateStudioDrafts.FindAsync(id);
        if ((draft?.Version ?? 0) != request.Version) throw new InvalidOperationException("This draft changed in another session. Reload before saving.");
        if (draft == null)
        {
            draft = new() { TemplateId = id, PublishedFingerprint = Fingerprint(await configService.GetDefaultAsync(id)) };
            db.TemplateStudioDrafts.Add(draft);
        }
        var sample = JsonNode.Parse(request.Sample.GetRawText())!.AsObject();
        Dictionary<string, string> content;
        try { content = sample["contentConfig"]?.Deserialize<Dictionary<string, string>>() ?? new(); }
        catch (JsonException) { throw new ArgumentException("Invalid sample content settings."); }
        content = content.Where(x => TemplateConfigPolicy.IsCoupleContent(x.Key)).ToDictionary();
        foreach (var (key, value) in request.Config.Where(x => TemplateConfigPolicy.IsCoupleContent(x.Key))) content[key] = value;
        sample["contentConfig"] = JsonSerializer.SerializeToNode(content);
        var sampleJson = sample.ToJsonString();
        if (sampleJson.Length > 200_000) throw new ArgumentException("Sample content exceeds 200 KB.");
        draft.ConfigJson = JsonSerializer.Serialize(request.Config.Where(x => !TemplateConfigPolicy.IsCoupleContent(x.Key)).ToDictionary());
        draft.SampleJson = sampleJson;
        draft.Version++;
        draft.UpdatedDate = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return await GetAsync(id);
    }

    public async Task<StudioStateDto> PublishAsync(int id, int version)
    {
        await EnsureTemplate(id);
        await using var tx = await db.Database.BeginTransactionAsync();
        var draft = await db.TemplateStudioDrafts.FindAsync(id) ?? throw new ArgumentException("Save a draft before publishing.");
        if (draft.Version != version) throw new InvalidOperationException("This draft changed in another session. Reload before publishing.");
        var current = await configService.GetDefaultAsync(id);
        if (Fingerprint(current) != draft.PublishedFingerprint)
            throw new InvalidOperationException("Live defaults changed outside Studio. Load the current published design before publishing.");
        var design = Parse(draft.ConfigJson);
        ValidateLayoutJson(design);
        // Use the same content exclusions, lock stripping and cinematic rechunking as event capture.
        design = TemplateConfigService.PrepareDefaultDesign(design);
        design = design.Where(x => !TemplateConfigPolicy.IsLayoutKey(x.Key) ||
            x.Key.StartsWith($"t{id}.layout.", StringComparison.Ordinal)).ToDictionary();
        design = PreserveAssets(id, design);
        var last = await db.TemplateStudioRevisions.Where(x => x.TemplateId == id).MaxAsync(x => (int?)x.Revision) ?? 0;
        if (last == 0)
            db.TemplateStudioRevisions.Add(new() { TemplateId = id, Revision = ++last, ConfigJson = JsonSerializer.Serialize(current) });
        var revision = new TemplateStudioRevision { TemplateId = id, Revision = last + 1, ConfigJson = JsonSerializer.Serialize(design) };
        db.TemplateStudioRevisions.Add(revision);
        var old = await db.TemplateConfigDefaults.Where(x => x.TemplateId == id).ToListAsync();
        db.TemplateConfigDefaults.RemoveRange(old);
        db.TemplateConfigDefaults.AddRange(design.Select(x => new TemplateConfigDefault { TemplateId = id, ConfigKey = x.Key, ConfigValue = x.Value }));
        draft.Version++;
        draft.UpdatedDate = DateTime.UtcNow;
        await db.SaveChangesAsync();
        var effective = await configService.GetDefaultAsync(id);
        revision.ConfigJson = JsonSerializer.Serialize(effective);
        draft.PublishedFingerprint = Fingerprint(effective);
        await db.SaveChangesAsync();
        await tx.CommitAsync();
        return await GetAsync(id);
    }

    // Restoring loads a revision into the draft. Publishing is always a separate action.
    public async Task<StudioStateDto> RestoreAsync(int id, StudioRestoreDto request)
    {
        await EnsureTemplate(id);
        await using var tx = await db.Database.BeginTransactionAsync();
        var config = request.Revision == 0 ? await configService.GetDefaultAsync(id) :
            Parse((await db.TemplateStudioRevisions.SingleOrDefaultAsync(x => x.TemplateId == id && x.Revision == request.Revision)
                ?? throw new KeyNotFoundException("Revision not found.")).ConfigJson);
        var state = await GetAsync(id);
        if (state.Version != request.Version) throw new InvalidOperationException("This draft changed. Reload before restoring.");
        var saved = await SaveAsync(id, new(request.Version, config, state.Sample));
        if (request.Revision == 0)
        {
            var draft = (await db.TemplateStudioDrafts.FindAsync(id))!;
            draft.PublishedFingerprint = Fingerprint(config);
            await db.SaveChangesAsync();
        }
        await tx.CommitAsync();
        return saved;
    }

    private Dictionary<string, string> PreserveAssets(int id, Dictionary<string, string> design)
    {
        var pattern = new Regex(@"/uploads/[^\s""'()<>\\]+", RegexOptions.Compiled);
        var root = Path.GetFullPath(environment?.WebRootPath ?? "wwwroot");
        var replacements = new Dictionary<string, string>(StringComparer.Ordinal);
        foreach (var url in design.Values.SelectMany(value => pattern.Matches(value).Select(m => m.Value)).Distinct())
        {
            var relative = Uri.UnescapeDataString(url).TrimStart('/');
            var source = Path.GetFullPath(Path.Combine(root, relative));
            if (!source.StartsWith(root + Path.DirectorySeparatorChar, StringComparison.Ordinal) || !File.Exists(source))
                throw new ArgumentException($"A design asset is missing or invalid: {url}. Replace it before publishing.");
            if (relative.StartsWith("uploads/templates/", StringComparison.Ordinal)) continue;
            // A published master must not depend on a client's upload directory surviving deletion.
            var hash = Convert.ToHexString(SHA256.HashData(File.ReadAllBytes(source))).ToLowerInvariant();
            var destination = $"/uploads/templates/studio-{id}/{hash}{Path.GetExtension(source)}";
            var fullDestination = Path.Combine(root, destination.TrimStart('/'));
            Directory.CreateDirectory(Path.GetDirectoryName(fullDestination)!);
            if (!File.Exists(fullDestination)) File.Copy(source, fullDestination);
            replacements[url] = destination;
        }
        if (replacements.Count == 0) return design;
        // Replacing paths can change chunk lengths: unpack whole cinematic projects before
        // editing, then use capture's rechunking so manifests remain internally consistent.
        var projects = design.Keys.Select(TemplateConfigPolicy.CinematicProjectBaseKey).Where(x => x != null).Distinct().ToList();
        foreach (var project in projects)
        {
            using var manifest = JsonDocument.Parse(design[project!]);
            var count = manifest.RootElement.GetProperty("chunks").GetInt32();
            var text = string.Concat(Enumerable.Range(0, count).Select(i => design[$"{project}.{i}"]));
            foreach (var (url, target) in replacements) text = text.Replace(url, target, StringComparison.Ordinal);
            foreach (var key in design.Keys.Where(k => k.StartsWith(project + ".", StringComparison.Ordinal)).ToList()) design.Remove(key);
            design[project!] = JsonSerializer.Serialize(new { version = manifest.RootElement.GetProperty("version").GetInt32(), chunks = 1, length = text.Length });
            design[$"{project}.0"] = text;
        }
        foreach (var key in design.Keys.Where(k => TemplateConfigPolicy.CinematicProjectBaseKey(k) == null).ToList())
            foreach (var (url, target) in replacements) design[key] = design[key].Replace(url, target, StringComparison.Ordinal);
        return TemplateConfigService.PrepareDefaultDesign(design);
    }

    private static void ValidateLayoutJson(Dictionary<string, string> config)
    {
        foreach (var (key, value) in config)
        {
            if (!TemplateConfigPolicy.IsLayoutKey(key)) continue;
            // Cinematic transport parts are fragments; validate their assembled document below.
            if (TemplateConfigPolicy.CinematicProjectBaseKey(key) is { } project && key != project) continue;
            if (string.IsNullOrWhiteSpace(value)) continue;
            if (!key.Contains(".mobile.") && !key.Contains(".desktop.") && TemplateConfigPolicy.CinematicProjectBaseKey(key) == null) continue;
            try { using var doc = JsonDocument.Parse(value); }
            catch (JsonException) { throw new ArgumentException($"Invalid layout JSON: {key}"); }
        }
        foreach (var project in config.Keys.Select(TemplateConfigPolicy.CinematicProjectBaseKey).Where(x => x != null).Distinct())
        {
            if (!config.TryGetValue(project!, out var raw)) throw new ArgumentException("Cinematic project manifest is missing.");
            try
            {
                using var manifest = JsonDocument.Parse(raw);
                var root = manifest.RootElement;
                var count = root.GetProperty("chunks").GetInt32();
                if (count < 1 || count > 1500) throw new ArgumentException("Invalid cinematic chunk count.");
                var parts = Enumerable.Range(0, count).Select(i => config.TryGetValue($"{project}.{i}", out var part) ? part : throw new ArgumentException("Cinematic project chunk is missing."));
                var json = string.Concat(parts);
                if (json.Length != root.GetProperty("length").GetInt32()) throw new ArgumentException("Cinematic project length does not match.");
                using var document = JsonDocument.Parse(json);
            }
            catch (Exception e) when (e is JsonException or KeyNotFoundException or InvalidOperationException or FormatException)
            { throw new ArgumentException("Invalid cinematic project."); }
        }
    }
}
