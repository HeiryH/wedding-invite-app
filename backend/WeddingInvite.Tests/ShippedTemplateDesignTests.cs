using System.IO.Compression;
using System.Security.Cryptography;
using System.Text.Json;
using WeddingInvite.Core.Services;
using WeddingInvite.Data.Repositories;
using WeddingInvite.Models;

namespace WeddingInvite.Tests;

public class ShippedTemplateDesignTests
{
    private class Shipped(Dictionary<string, string> config, string? thumbnail = null) : ITemplateShippedDesignStore
    {
        public Task<Dictionary<string, string>> GetAsync(int id) => Task.FromResult(new Dictionary<string, string>(config));
        public string? GetThumbnail(string code) => thumbnail;
    }
    private static TemplateConfigService Config(TestDb db, Dictionary<string, string> shipped) => new(
        new TemplateConfigRepository(db.Context), new TemplateConfigDefaultRepository(db.Context),
        new EventRepository(db.Context), new Shipped(shipped));

    [Fact]
    public async Task Shipped_design_published_defaults_and_event_overrides_have_explicit_precedence()
    {
        using var db = new TestDb();
        var config = Config(db, new() { ["invite.heading"] = "Shipped", ["nav.welcome"] = "Home" });
        Assert.Equal("Shipped", (await config.GetDefaultAsync(7))["invite.heading"]);
        await new TemplateConfigDefaultRepository(db.Context).ReplaceAsync(7, new() { ["invite.heading"] = "Published" });
        var evt = new Event { Slug = "baseline-test", TemplateId = 7, Venue = "Sample", EventDate = DateTime.UtcNow };
        db.Context.Events.Add(evt); await db.Context.SaveChangesAsync();
        db.Context.TemplateConfigs.Add(new() { EventId = evt.EventId, ConfigKey = "invite.heading", ConfigValue = "Client" });
        await db.Context.SaveChangesAsync();
        Assert.Equal("Client", (await config.GetConfigAsync(evt.EventId))["invite.heading"]);
        Assert.Equal("Home", (await config.GetConfigAsync(evt.EventId))["nav.welcome"]);
        await config.ClearDefaultAsync(7);
        Assert.Equal("Shipped", (await config.GetDefaultAsync(7))["invite.heading"]);
        Assert.Equal("Client", (await config.GetConfigAsync(evt.EventId))["invite.heading"]);
    }

    [Fact]
    public async Task Cinematic_defaults_never_mix_shipped_and_published_transport_chunks()
    {
        using var db = new TestDb();
        const string project = "t15.layout.cinematic-project";
        var config = Config(db, new() { [project] = "old", [project + ".0"] = "old0", [project + ".1"] = "old1" });
        await new TemplateConfigDefaultRepository(db.Context).ReplaceAsync(7, new() { [project] = "new", [project + ".0"] = "new0" });
        var effective = await config.GetDefaultAsync(7);
        Assert.Equal("new0", effective[project + ".0"]);
        Assert.DoesNotContain(project + ".1", effective.Keys);
    }

    [Fact]
    public async Task Shipped_thumbnail_is_a_fallback_for_both_picker_and_admin_metadata()
    {
        using var db = new TestDb();
        var template = (await db.Context.Templates.FindAsync(7))!;
        template.ThumbnailUrl = "";
        await db.Context.SaveChangesAsync();
        var service = new TemplateService(new TemplateRepository(db.Context), new Shipped(new(), "/templates/roman-garden/studio-assets/thumbnail.png"));
        Assert.Equal("/templates/roman-garden/studio-assets/thumbnail.png", (await service.GetByIdAsync(7))!.ThumbnailUrl);
        Assert.Equal("/templates/roman-garden/studio-assets/thumbnail.png", (await service.GetAllWithUsageAsync()).Single(x => x.TemplateId == 7).ThumbnailUrl);
        template.ThumbnailUrl = "/uploads/templates/newer.png";
        await db.Context.SaveChangesAsync();
        Assert.Equal("/uploads/templates/newer.png", (await service.GetByIdAsync(7))!.ThumbnailUrl);
    }

    [Fact]
    public async Task Published_export_records_exact_revision_and_checksum_and_excludes_draft_edits()
    {
        using var db = new TestDb();
        var config = Config(db, new() { ["nav.welcome"] = "Shipped home" });
        var studio = new TemplateStudioService(db.Context, config);
        var sample = JsonSerializer.SerializeToElement(new { });
        await studio.SaveAsync(7, new(0, new() { ["invite.heading"] = "Published" }, sample));
        var published = await studio.PublishAsync(7, 1);
        var edited = await studio.SaveAsync(7, new(published.Version, new() { ["invite.heading"] = "Unsaved to public" }, sample));
        var bundleService = new TemplateDesignService(new TemplateRepository(db.Context), new TemplateConfigDefaultRepository(db.Context), config);
        var exports = new TemplateStudioExportService(db.Context, studio, config, bundleService);
        await Assert.ThrowsAsync<InvalidOperationException>(() => exports.ExportAsync(7, published.Version));
        using var stream = new MemoryStream(await exports.ExportAsync(7, edited.Version));
        using var zip = new ZipArchive(stream);
        using var buffer = new MemoryStream();
        await zip.GetEntry("design.json")!.Open().CopyToAsync(buffer);
        var designBytes = buffer.ToArray();
        using var manifest = await JsonDocument.ParseAsync(zip.GetEntry("studio.json")!.Open());
        Assert.Equal(2, manifest.RootElement.GetProperty("publishedRevision").GetInt32());
        Assert.Equal(Convert.ToHexString(SHA256.HashData(designBytes)).ToLowerInvariant(), manifest.RootElement.GetProperty("designSha256").GetString());
        using var design = JsonDocument.Parse(designBytes);
        var exported = design.RootElement.GetProperty("templates")[0].GetProperty("defaultConfig");
        Assert.Equal("Published", exported.GetProperty("invite.heading").GetString());
        Assert.Equal("Shipped home", exported.GetProperty("nav.welcome").GetString());
        // Repeated publishing must not report an external conflict against our own shipped underlay.
        await studio.PublishAsync(7, edited.Version);
    }

    [Fact]
    public async Task Export_includes_shipped_assets_and_live_import_rehomes_them_without_breaking_chunks()
    {
        using var db = new TestDb();
        var bytes = Guid.NewGuid().ToByteArray();
        var hash = Convert.ToHexString(SHA256.HashData(bytes)).ToLowerInvariant();
        var url = $"/templates/roman-garden/studio-assets/{hash}.png";
        var project = "t7.layout.cinematic-project";
        var document = JsonSerializer.Serialize(new { id = "art", image = url, text = new string('x', 5000) });
        var baked = new Dictionary<string, string> {
            [project] = JsonSerializer.Serialize(new { version = 1, chunks = 2, length = document.Length }),
            [project + ".0"] = document[..3500], [project + ".1"] = document[3500..],
        };
        var store = new AssetStore(baked, url, bytes);
        var configs = new TemplateConfigService(new TemplateConfigRepository(db.Context), new TemplateConfigDefaultRepository(db.Context), new EventRepository(db.Context), store);
        var service = new TemplateDesignService(new TemplateRepository(db.Context), new TemplateConfigDefaultRepository(db.Context), configs, store);
        var exported = await service.ExportAsync(new[] { 7 });
        using (var zip = new ZipArchive(new MemoryStream(exported)))
            Assert.NotNull(zip.GetEntry("assets" + url));
        var path = Path.Combine("wwwroot", "uploads", "templates", $"roman-garden-import-{hash[..16]}.png");
        Assert.False(File.Exists(path));
        try
        {
            var result = await service.ImportAsync(new MemoryStream(exported), false);
            Assert.Equal(1, result.Applied.Single().AssetsWritten);
            var saved = await new TemplateConfigDefaultRepository(db.Context).GetByTemplateIdAsync(7);
            using var manifest = JsonDocument.Parse(saved[project]);
            var complete = string.Concat(Enumerable.Range(0, manifest.RootElement.GetProperty("chunks").GetInt32()).Select(i => saved[$"{project}.{i}"]));
            Assert.Equal(complete.Length, manifest.RootElement.GetProperty("length").GetInt32());
            using var data = JsonDocument.Parse(complete);
            Assert.StartsWith("/uploads/templates/", data.RootElement.GetProperty("image").GetString());
            Assert.Equal(bytes, await File.ReadAllBytesAsync(path));
        }
        finally { if (File.Exists(path)) File.Delete(path); }
    }

    private class AssetStore(Dictionary<string, string> config, string url, byte[] data) : ITemplateShippedDesignStore
    {
        public Task<Dictionary<string, string>> GetAsync(int id) => Task.FromResult(new Dictionary<string, string>(config));
        public byte[]? GetAsset(string asset) => asset == url ? data : null;
    }
}
