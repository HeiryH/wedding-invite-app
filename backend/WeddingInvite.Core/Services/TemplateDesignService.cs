using System.IO.Compression;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;
using WeddingInvite.Data.Repositories;

namespace WeddingInvite.Core.Services
{
    public class TemplateDesignService : ITemplateDesignService
    {
        private readonly ITemplateRepository _templateRepo;
        private readonly ITemplateConfigDefaultRepository _defaultRepo;

        private const int BundleVersion = 1;
        private const long MaxBundleBytes = 200L * 1024 * 1024;
        private const long MaxAssetBytes = 25L * 1024 * 1024;
        private static readonly string[] AllowedAssetExtensions =
            { ".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".mp3", ".m4a", ".ogg", ".wav", ".mp4", ".webm" };

        // Any "/uploads/…" path embedded in a config value, StagesJson blob or thumbnail URL.
        // Stops at quotes/whitespace/closing brackets so a path inside a JSON string or a
        // CSS url(...) is captured cleanly.
        private static readonly Regex UploadRef = new(@"/uploads/[^\s""'()<>\\]+", RegexOptions.Compiled);

        private static readonly JsonSerializerOptions JsonOptions = new()
        {
            WriteIndented = true,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
        };

        public TemplateDesignService(ITemplateRepository templateRepo, ITemplateConfigDefaultRepository defaultRepo)
        {
            _templateRepo = templateRepo;
            _defaultRepo = defaultRepo;
        }

        // ── Bundle shape ────────────────────────────────────────────────────────────────────

        private class Bundle
        {
            public int Version { get; set; } = BundleVersion;
            public DateTime ExportedAt { get; set; } = DateTime.UtcNow;
            public List<BundleTemplate> Templates { get; set; } = new();
        }

        private class BundleTemplate
        {
            public string TemplateCode { get; set; } = string.Empty;
            public string TemplateName { get; set; } = string.Empty;
            public string Description { get; set; } = string.Empty;
            public string Tier { get; set; } = "BASIC";
            public string EventTypes { get; set; } = "WEDDING";
            public string ThumbnailUrl { get; set; } = string.Empty;
            public bool IsAuthored { get; set; }
            public string? StagesJson { get; set; }
            public Dictionary<string, string> DefaultConfig { get; set; } = new();
        }

        // ── Export ──────────────────────────────────────────────────────────────────────────

        public async Task<byte[]> ExportAsync(IReadOnlyCollection<int> templateIds)
        {
            var all = await _templateRepo.GetAllAsync();
            var chosen = templateIds.Count == 0
                ? all.OrderBy(t => t.SortOrder).ThenBy(t => t.TemplateId).ToList()
                : all.Where(t => templateIds.Contains(t.TemplateId)).ToList();

            var bundle = new Bundle();
            var assets = new HashSet<string>(StringComparer.Ordinal);

            foreach (var t in chosen)
            {
                var entry = new BundleTemplate
                {
                    TemplateCode = t.TemplateCode,
                    TemplateName = t.TemplateName,
                    Description = t.Description,
                    Tier = t.Tier,
                    EventTypes = t.EventTypes,
                    ThumbnailUrl = t.ThumbnailUrl,
                    IsAuthored = t.IsAuthored,
                    StagesJson = t.StagesJson,
                    DefaultConfig = await _defaultRepo.GetByTemplateIdAsync(t.TemplateId),
                };
                bundle.Templates.Add(entry);

                CollectRefs(entry.ThumbnailUrl, assets);
                CollectRefs(entry.StagesJson, assets);
                foreach (var v in entry.DefaultConfig.Values) CollectRefs(v, assets);
            }

            using var ms = new MemoryStream();
            using (var zip = new ZipArchive(ms, ZipArchiveMode.Create, leaveOpen: true))
            {
                var json = zip.CreateEntry("design.json", CompressionLevel.Optimal);
                await using (var s = json.Open())
                {
                    await s.WriteAsync(Encoding.UTF8.GetBytes(JsonSerializer.Serialize(bundle, JsonOptions)));
                }

                // Assets keep their site-relative path inside the zip (assets/uploads/…) so the
                // importer can rewrite each reference back to whatever it stored the file as.
                foreach (var url in assets)
                {
                    var disk = ToDiskPath(url);
                    if (disk == null || !File.Exists(disk)) continue;
                    zip.CreateEntryFromFile(disk, "assets" + url, CompressionLevel.Fastest);
                }
            }
            return ms.ToArray();
        }

        // ── Import ──────────────────────────────────────────────────────────────────────────

        public async Task<TemplateDesignImportResult> ImportAsync(Stream bundleStream, bool applyMeta)
        {
            if (bundleStream.CanSeek && bundleStream.Length > MaxBundleBytes)
                throw new ArgumentException($"Bundle exceeds {MaxBundleBytes / 1024 / 1024}MB");

            using var zip = new ZipArchive(bundleStream, ZipArchiveMode.Read);
            var manifest = zip.GetEntry("design.json")
                ?? throw new ArgumentException("Not a template design bundle (design.json missing)");

            Bundle bundle;
            await using (var s = manifest.Open())
            {
                bundle = await JsonSerializer.DeserializeAsync<Bundle>(s, JsonOptions)
                    ?? throw new ArgumentException("design.json is empty");
            }
            if (bundle.Version > BundleVersion)
                throw new ArgumentException($"Bundle version {bundle.Version} is newer than this server supports ({BundleVersion})");

            var assetEntries = zip.Entries
                .Where(e => e.FullName.StartsWith("assets/uploads/", StringComparison.Ordinal) && e.Length > 0)
                .ToDictionary(e => e.FullName.Substring("assets".Length), e => e, StringComparer.Ordinal);

            var result = new TemplateDesignImportResult();
            // Old URL → new URL, shared across templates so one asset referenced twice is written once.
            var rewritten = new Dictionary<string, string>(StringComparer.Ordinal);

            foreach (var bt in bundle.Templates)
            {
                if (string.IsNullOrWhiteSpace(bt.TemplateCode)) continue;
                var template = await _templateRepo.GetByCodeAsync(bt.TemplateCode);
                if (template == null)
                {
                    result.Skipped.Add(bt.TemplateCode);
                    continue;
                }

                var entry = new TemplateDesignImportEntry { TemplateId = template.TemplateId, TemplateCode = template.TemplateCode };

                // Rehome every referenced asset under /uploads/templates/ — a design captured from
                // a local test event references /uploads/{eventId}/… which EventService.DeleteAsync
                // would wipe if that id were ever deleted here. Content-hashed names make re-imports
                // idempotent instead of piling up copies.
                string Rewrite(string? text)
                {
                    if (string.IsNullOrEmpty(text)) return text ?? string.Empty;
                    return UploadRef.Replace(text, m =>
                    {
                        var url = m.Value;
                        if (rewritten.TryGetValue(url, out var already)) return already;
                        if (!assetEntries.TryGetValue(url, out var ze)) return url; // not shipped — leave as-is
                        var ext = Path.GetExtension(url).ToLowerInvariant();
                        if (!AllowedAssetExtensions.Contains(ext) || ze.Length > MaxAssetBytes) return url;

                        byte[] bytes;
                        using (var es = ze.Open())
                        using (var buf = new MemoryStream())
                        {
                            es.CopyTo(buf);
                            bytes = buf.ToArray();
                        }
                        var hash = Convert.ToHexString(SHA256.HashData(bytes))[..16].ToLowerInvariant();
                        var fileName = $"{template.TemplateCode}-import-{hash}{ext}";
                        var folder = Path.Combine("wwwroot", "uploads", "templates");
                        Directory.CreateDirectory(folder);
                        var disk = Path.Combine(folder, fileName);
                        if (!File.Exists(disk))
                        {
                            File.WriteAllBytes(disk, bytes);
                            entry.AssetsWritten++;
                        }
                        var newUrl = $"/uploads/templates/{fileName}";
                        rewritten[url] = newUrl;
                        return newUrl;
                    });
                }

                // Starting design (whole-bag replace; an empty bag clears it — same as the admin UI).
                var config = bt.DefaultConfig.ToDictionary(kv => kv.Key, kv => Rewrite(kv.Value), StringComparer.Ordinal);
                await _defaultRepo.ReplaceAsync(template.TemplateId, config);
                entry.DefaultKeyCount = config.Count;

                // Authored composition.
                if (bt.IsAuthored && !string.IsNullOrWhiteSpace(bt.StagesJson))
                {
                    var stages = Rewrite(bt.StagesJson);
                    JsonDocument.Parse(stages); // reject a corrupt blob before it lands in the row
                    template.StagesJson = stages;
                    template.IsAuthored = true;
                    entry.StagesApplied = true;
                }
                else if (!bt.IsAuthored && template.IsAuthored)
                {
                    // Source is hand-coded: don't silently strip an authored composition here.
                    entry.StagesApplied = false;
                }

                if (!string.IsNullOrWhiteSpace(bt.ThumbnailUrl))
                {
                    var thumb = Rewrite(bt.ThumbnailUrl);
                    // Only adopt a thumbnail we actually have on disk now.
                    var disk = ToDiskPath(thumb);
                    if (disk != null && File.Exists(disk))
                    {
                        template.ThumbnailUrl = thumb;
                        entry.ThumbnailApplied = true;
                    }
                }

                if (applyMeta)
                {
                    if (!string.IsNullOrWhiteSpace(bt.TemplateName)) template.TemplateName = bt.TemplateName;
                    template.Description = bt.Description ?? string.Empty;
                    var tier = (bt.Tier ?? "BASIC").ToUpperInvariant();
                    if (tier is "BASIC" or "PREMIUM" or "PRO")
                    {
                        template.Tier = tier;
                        template.IsPremium = tier != "BASIC";
                    }
                    template.EventTypes = TemplateService.NormalizeEventTypes(bt.EventTypes);
                }

                await _templateRepo.UpdateAsync(template);
                result.Applied.Add(entry);
            }

            return result;
        }

        // ── Helpers ─────────────────────────────────────────────────────────────────────────

        private static void CollectRefs(string? text, HashSet<string> into)
        {
            if (string.IsNullOrEmpty(text)) return;
            foreach (Match m in UploadRef.Matches(text)) into.Add(m.Value);
        }

        // "/uploads/a/b.png" → "wwwroot/uploads/a/b.png", refusing anything that escapes wwwroot.
        private static string? ToDiskPath(string url)
        {
            if (!url.StartsWith("/uploads/", StringComparison.Ordinal)) return null;
            var rel = url.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
            var root = Path.GetFullPath("wwwroot");
            var full = Path.GetFullPath(Path.Combine(root, rel));
            return full.StartsWith(root + Path.DirectorySeparatorChar, StringComparison.Ordinal) ? full : null;
        }
    }
}
