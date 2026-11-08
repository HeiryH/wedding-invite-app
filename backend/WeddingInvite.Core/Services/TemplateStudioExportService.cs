using System.IO.Compression;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using WeddingInvite.Data;

namespace WeddingInvite.Core.Services;

public class TemplateStudioExportService(AppDbContext db, TemplateStudioService studio, ITemplateConfigService configs, ITemplateDesignService bundles)
{
    public async Task<byte[]> ExportAsync(int id, int version)
    {
        // All reads (metadata, defaults, revision) share one database snapshot.
        await using var transaction = await db.Database.BeginTransactionAsync();
        var state = await studio.GetAsync(id);
        if (state.Version != version) throw new InvalidOperationException("The workspace changed. Reload before exporting.");
        var template = await db.Templates.FindAsync(id) ?? throw new KeyNotFoundException("Template not found.");
        var current = await configs.GetDefaultAsync(id);
        var latest = await db.TemplateStudioRevisions.Where(x => x.TemplateId == id).OrderByDescending(x => x.Revision).FirstOrDefaultAsync();
        var previous = latest == null ? null : JsonSerializer.Deserialize<Dictionary<string, string>>(latest.ConfigJson);
        var matches = previous != null && previous.Count == current.Count && current.All(x => previous.TryGetValue(x.Key, out var value) && value == x.Value);
        var bytes = await bundles.ExportAsync(new[] { id });
        using var stream = new MemoryStream();
        await stream.WriteAsync(bytes);
        stream.Position = 0;
        using (var zip = new ZipArchive(stream, ZipArchiveMode.Update, leaveOpen: true))
        {
            var design = zip.GetEntry("design.json") ?? throw new InvalidOperationException("Design bundle is missing its design document.");
            byte[] content;
            using (var buffer = new MemoryStream()) { await using var input = design.Open(); await input.CopyToAsync(buffer); content = buffer.ToArray(); }
            var manifest = new
            {
                schemaVersion = 1, templateCode = template.TemplateCode,
                publishedRevision = matches ? (int?)latest!.Revision : null,
                source = matches ? "studio-published" : "current-published-defaults",
                exportedAt = DateTime.UtcNow,
                designSha256 = Convert.ToHexString(SHA256.HashData(content)).ToLowerInvariant(),
            };
            var entry = zip.CreateEntry("studio.json");
            await using var output = entry.Open();
            await output.WriteAsync(Encoding.UTF8.GetBytes(JsonSerializer.Serialize(manifest, new JsonSerializerOptions { WriteIndented = true })));
        }
        await transaction.CommitAsync();
        return stream.ToArray();
    }
}
