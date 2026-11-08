using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.FileProviders;
using WeddingInvite.Core.Services;
using WeddingInvite.Data.Repositories;

namespace WeddingInvite.Tests;

public class TemplateStudioTests
{
    private static TemplateStudioService Studio(TestDb db) => new(db.Context,
        new TemplateConfigService(new TemplateConfigRepository(db.Context),
            new TemplateConfigDefaultRepository(db.Context), new EventRepository(db.Context)));
    private static JsonElement Sample => JsonSerializer.SerializeToElement(new { wedding = new { brideName = "Sample only" } });

    [Fact]
    public async Task Draft_save_survives_reload_without_changing_live_defaults()
    {
        using var db = new TestDb();
        var defaults = new TemplateConfigDefaultRepository(db.Context);
        await defaults.ReplaceAsync(7, new() { ["invite.heading"] = "Published" });
        var studio = Studio(db);
        var initial = await studio.GetAsync(7);
        Assert.Equal(0, initial.Version);
        var saved = await studio.SaveAsync(7, new(0, new() { ["invite.heading"] = "Draft" }, Sample));
        Assert.Equal(1, saved.Version);
        Assert.Equal("Published", (await defaults.GetByTemplateIdAsync(7))["invite.heading"]);
        db.Context.ChangeTracker.Clear();
        var restored = await Studio(db).GetAsync(7);
        Assert.Equal("Draft", restored.Config["invite.heading"]);
        Assert.Equal("Sample only", restored.Sample.GetProperty("wedding").GetProperty("brideName").GetString());
    }

    [Fact]
    public async Task Publish_keeps_previous_revision_excludes_content_and_strips_editor_locks()
    {
        using var db = new TestDb();
        var defaults = new TemplateConfigDefaultRepository(db.Context);
        await defaults.ReplaceAsync(7, new() { ["invite.heading"] = "Original" });
        var studio = Studio(db);
        var draft = await studio.SaveAsync(7, new(0, new() {
            ["invite.heading"] = "New", ["invite.body"] = "Private wording", ["music.url"] = "/uploads/private.mp3",
            ["t7.layout.mobile.welcome"] = "{\"layers\":[{\"id\":\"flower\",\"locked\":true,\"x\":25}]}",
            ["t13.layout.mobile.welcome"] = "{}",
        }, Sample));
        Assert.DoesNotContain("invite.body", draft.Config.Keys);
        Assert.Equal("Private wording", draft.Sample.GetProperty("contentConfig").GetProperty("invite.body").GetString());
        var published = await studio.PublishAsync(7, 1);
        var live = await defaults.GetByTemplateIdAsync(7);
        Assert.Equal("New", live["invite.heading"]);
        Assert.DoesNotContain("invite.body", live.Keys);
        Assert.DoesNotContain("music.url", live.Keys);
        Assert.DoesNotContain("t13.layout.mobile.welcome", live.Keys);
        Assert.DoesNotContain("locked", live["t7.layout.mobile.welcome"]);
        Assert.Equal(2, published.Revisions.Count);
        var restored = await studio.RestoreAsync(7, new(published.Version, 1));
        Assert.Equal("Original", restored.Config["invite.heading"]);
        Assert.Equal("New", (await defaults.GetByTemplateIdAsync(7))["invite.heading"]);
        await studio.PublishAsync(7, restored.Version);
        Assert.Equal("Original", (await defaults.GetByTemplateIdAsync(7))["invite.heading"]);
    }

    [Fact]
    public async Task Stale_saves_and_publishes_are_rejected()
    {
        using var db = new TestDb();
        var studio = Studio(db);
        await studio.SaveAsync(7, new(0, new(), Sample));
        await Assert.ThrowsAsync<InvalidOperationException>(() => studio.SaveAsync(7, new(0, new(), Sample)));
        await Assert.ThrowsAsync<InvalidOperationException>(() => studio.PublishAsync(7, 0));
    }

    [Fact]
    public async Task Thumbnail_capture_rejects_stale_workspace_or_published_design()
    {
        using var db = new TestDb();
        var studio = Studio(db);
        var state = await studio.GetAsync(7);
        await Assert.ThrowsAsync<InvalidOperationException>(() => studio.SetThumbnailAsync(7, state.Version, "stale-design", null!, null!));
        await Assert.ThrowsAsync<InvalidOperationException>(() => studio.SetThumbnailAsync(7, state.Version + 1, state.PublishedDesignHash, null!, null!));
    }

    [Fact]
    public async Task External_default_changes_require_explicit_reload_of_published_design()
    {
        using var db = new TestDb();
        var studio = Studio(db);
        await studio.SaveAsync(7, new(0, new() { ["invite.heading"] = "Draft" }, Sample));
        var defaults = new TemplateConfigDefaultRepository(db.Context);
        await defaults.ReplaceAsync(7, new() { ["invite.heading"] = "External" });
        await Assert.ThrowsAsync<InvalidOperationException>(() => studio.PublishAsync(7, 1));
        var reloaded = await studio.RestoreAsync(7, new(1, 0));
        await studio.PublishAsync(7, reloaded.Version);
        Assert.Equal("External", (await defaults.GetByTemplateIdAsync(7))["invite.heading"]);
    }

    [Fact]
    public async Task Missing_templates_and_broken_layouts_are_rejected()
    {
        using var db = new TestDb();
        var studio = Studio(db);
        await Assert.ThrowsAsync<KeyNotFoundException>(() => studio.GetAsync(999999));
        await Assert.ThrowsAsync<ArgumentException>(() => studio.SaveAsync(7,
            new(0, new() { ["t7.layout.mobile.welcome"] = "broken" }, Sample)));
        await Assert.ThrowsAsync<ArgumentException>(() => studio.SaveAsync(7,
            new(0, new() { ["t7.layout.cinematic-project"] = "{\"version\":1,\"chunks\":1,\"length\":20}" }, Sample)));
    }

    [Fact]
    public async Task Missing_assets_block_publish_without_replacing_defaults()
    {
        using var db = new TestDb();
        var defaults = new TemplateConfigDefaultRepository(db.Context);
        await defaults.ReplaceAsync(7, new() { ["invite.heading"] = "Original" });
        var studio = Studio(db);
        await studio.SaveAsync(7, new(0, new() { ["art"] = "/uploads/not-a-real-studio-asset.png" }, Sample));
        await Assert.ThrowsAsync<ArgumentException>(() => studio.PublishAsync(7, 1));
        Assert.Equal("Original", (await defaults.GetByTemplateIdAsync(7))["invite.heading"]);
        Assert.Empty((await studio.GetAsync(7)).Revisions);
    }

    [Fact]
    public async Task Client_assets_are_copied_to_template_storage_and_cinematic_chunks_stay_valid()
    {
        using var db = new TestDb();
        var root = Path.Combine(Path.GetTempPath(), "studio-assets-" + Guid.NewGuid());
        Directory.CreateDirectory(Path.Combine(root, "uploads/63"));
        await File.WriteAllBytesAsync(Path.Combine(root, "uploads/63/art.png"), new byte[] { 1, 2, 3 });
        try
        {
            var config = new TemplateConfigService(new TemplateConfigRepository(db.Context), new TemplateConfigDefaultRepository(db.Context), new EventRepository(db.Context));
            var studio = new TemplateStudioService(db.Context, config, new StudioEnvironment { WebRootPath = root });
            var json = JsonSerializer.Serialize(new { id = "art", image = "/uploads/63/art.png", locked = true, text = new string('x', 5000) });
            const string project = "t7.layout.cinematic-project";
            await studio.SaveAsync(7, new(0, new() {
                [project] = JsonSerializer.Serialize(new { version = 1, chunks = 2, length = json.Length }),
                [project + ".0"] = json[..3500], [project + ".1"] = json[3500..],
            }, Sample));
            await studio.PublishAsync(7, 1);
            var saved = await config.GetDefaultAsync(7);
            using var manifest = JsonDocument.Parse(saved[project]);
            var assembled = string.Concat(Enumerable.Range(0, manifest.RootElement.GetProperty("chunks").GetInt32()).Select(i => saved[$"{project}.{i}"]));
            Assert.Equal(assembled.Length, manifest.RootElement.GetProperty("length").GetInt32());
            using var parsed = JsonDocument.Parse(assembled);
            var image = parsed.RootElement.GetProperty("image").GetString()!;
            Assert.StartsWith("/uploads/templates/studio-7/", image);
            Assert.True(File.Exists(Path.Combine(root, image.TrimStart('/'))));
            Assert.DoesNotContain("locked", assembled);
        }
        finally { Directory.Delete(root, true); }
    }

    private class StudioEnvironment : IWebHostEnvironment
    {
        public string WebRootPath { get; set; } = "";
        public IFileProvider WebRootFileProvider { get; set; } = new NullFileProvider();
        public string ApplicationName { get; set; } = "Tests";
        public string EnvironmentName { get; set; } = "Testing";
        public string ContentRootPath { get; set; } = "";
        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }
}
