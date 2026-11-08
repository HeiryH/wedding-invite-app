using System.Buffers.Binary;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Logging.Abstractions;
using WeddingInvite.Core.DTOs;
using WeddingInvite.Core.Services;
using WeddingInvite.Data.Repositories;

namespace WeddingInvite.Tests;

public class TemplateCaptureTests
{
    private const string Owner = "admin@example.test";
    private static IFormFile Png(uint width = 390)
    {
        var bytes = new byte[24];
        new byte[] { 137, 80, 78, 71, 13, 10, 26, 10 }.CopyTo(bytes, 0);
        BinaryPrimitives.WriteUInt32BigEndian(bytes.AsSpan(16), width);
        BinaryPrimitives.WriteUInt32BigEndian(bytes.AsSpan(20), 700);
        return new FormFile(new MemoryStream(bytes), 0, bytes.Length, "file", "capture.png") { Headers = new HeaderDictionary(), ContentType = "image/png" };
    }

    [Fact]
    public async Task Offline_renderer_is_rejected_without_creating_jobs()
    {
        using var f = new Fixture(false);
        var error = await Assert.ThrowsAsync<CaptureUnavailableException>(() => f.Service.StartAsync(7, Owner));
        Assert.Contains("not connected", error.Message);
        Assert.Empty(f.Db.Context.TemplateCaptureJobs);
        f.Service.Heartbeat();
        Assert.Equal("pending", (await f.Service.StartAsync(7, Owner)).Status);
    }

    [Fact]
    public async Task Missing_worker_configuration_has_an_actionable_error()
    {
        using var f = new Fixture(configured: false);
        var error = await Assert.ThrowsAsync<CaptureUnavailableException>(() => f.Service.StartAsync(7, Owner));
        Assert.Contains("not configured", error.Message);
        Assert.Empty(f.Db.Context.TemplateCaptureJobs);
    }

    [Fact]
    public async Task Worker_receives_the_current_preview_names_config_geometry_and_scroll()
    {
        using var f = new Fixture();
        var payload = System.Text.Json.JsonSerializer.SerializeToElement(new { wedding = new { templateId = 7, brideName = "Mary", groomName = "John" }, customConfig = new { heading = "Draft heading" } });
        var snapshot = new CapturePreviewSnapshot(payload, 510, 915, 0, 200);
        var job = await f.Service.StartAsync(7, Owner, snapshot);
        var lease = (await f.Service.ClaimAsync())!;
        Assert.Equal(job.Id, lease.Id);
        Assert.Equal(510, lease.Width);
        Assert.Equal(915, lease.Height);
        Assert.Equal(200, lease.Snapshot!.ScrollY);
        Assert.Equal("Mary", lease.Snapshot.Payload.GetProperty("wedding").GetProperty("brideName").GetString());
        Assert.Equal("Draft heading", lease.Snapshot.Payload.GetProperty("customConfig").GetProperty("heading").GetString());
        Assert.Empty(await f.Defaults.GetByTemplateIdAsync(7));
    }

    [Fact]
    public async Task Different_preview_state_does_not_reuse_a_previous_capture()
    {
        using var f = new Fixture();
        CapturePreviewSnapshot Snapshot(string name) => new(System.Text.Json.JsonSerializer.SerializeToElement(new { wedding = new { templateId = 7, brideName = name } }), 510, 915);
        var first = await f.Service.StartAsync(7, Owner, Snapshot("Mary"));
        var second = await f.Service.StartAsync(7, Owner, Snapshot("Aisyah"));
        Assert.NotEqual(first.Id, second.Id);
        Assert.Equal("cancelled", (await f.Service.GetAsync(7, first.Id, Owner)).Status);
    }

    [Fact]
    public async Task A_snapshot_for_another_template_is_rejected()
    {
        using var f = new Fixture();
        var payload = System.Text.Json.JsonSerializer.SerializeToElement(new { wedding = new { templateId = 15 } });
        await Assert.ThrowsAsync<ArgumentException>(() => f.Service.StartAsync(7, Owner, new(payload, 510, 915)));
        Assert.Empty(f.Db.Context.TemplateCaptureJobs);
    }

    [Fact]
    public async Task Capture_identifies_the_published_revision_without_mislabeling_external_changes()
    {
        using var f = new Fixture();
        var saved = await f.Studio.SaveAsync(7, new(0, new() { ["invite.heading"] = "Published" }, System.Text.Json.JsonSerializer.SerializeToElement(new { })));
        await f.Studio.PublishAsync(7, saved.Version);
        var job = await f.Service.StartAsync(7, Owner);
        Assert.Equal(2, job.PublishedRevision);
        await f.Defaults.ReplaceAsync(7, new() { ["invite.heading"] = "External change" });
        Assert.Null((await f.Service.StartAsync(7, Owner)).PublishedRevision);
    }

    [Fact]
    public async Task Ready_capture_is_private_and_cancel_preserves_existing_thumbnail()
    {
        using var f = new Fixture();
        var job = await f.Ready();
        Assert.Equal("ready", (await f.Service.GetAsync(7, job.Id, Owner)).Status);
        Assert.Equal(24, (await f.Service.GetImageAsync(7, job.Id, Owner)).Length);
        Assert.Equal(0, f.Sink.Calls);
        Assert.False(Directory.Exists(Path.Combine(f.Root, "wwwroot")));
        await f.Service.CancelAsync(7, job.Id, Owner);
        Assert.Equal("cancelled", (await f.Service.GetAsync(7, job.Id, Owner)).Status);
        await Assert.ThrowsAsync<KeyNotFoundException>(() => f.Service.GetImageAsync(7, job.Id, Owner));
        Assert.Equal(0, f.Sink.Calls);
    }

    [Fact]
    public async Task Only_explicit_approval_applies_a_thumbnail_and_cleans_up_private_image()
    {
        using var f = new Fixture();
        var job = await f.Ready();
        await f.Service.ApplyAsync(7, job.Id, Owner);
        Assert.Equal(1, f.Sink.Calls);
        Assert.True(f.Sink.PreservedPrevious);
        Assert.Equal("applied", (await f.Service.GetAsync(7, job.Id, Owner)).Status);
        Assert.Empty(Directory.GetFiles(Path.Combine(f.Root, ".template-captures")));
        await Assert.ThrowsAsync<InvalidOperationException>(() => f.Service.ApplyAsync(7, job.Id, Owner));
        Assert.Equal(1, f.Sink.Calls);
        Assert.Empty(f.Db.Context.Events);
        Assert.Empty(f.Db.Context.TemplateConfigs);
    }

    [Fact]
    public async Task Publication_during_render_or_review_cannot_apply_a_stale_image()
    {
        using var f = new Fixture();
        var job = await f.Service.StartAsync(7, Owner);
        var lease = (await f.Service.ClaimAsync())!;
        await f.Defaults.ReplaceAsync(7, new() { ["invite.heading"] = "New design" });
        await f.Service.CompleteAsync(job.Id, lease.LeaseToken, Png());
        Assert.Equal("failed", (await f.Service.GetAsync(7, job.Id, Owner)).Status);
        var ready = await f.Ready();
        await f.Defaults.ReplaceAsync(7, new() { ["invite.heading"] = "An even newer design" });
        await Assert.ThrowsAsync<InvalidOperationException>(() => f.Service.ApplyAsync(7, ready.Id, Owner));
        Assert.Equal(0, f.Sink.Calls);
    }

    [Fact]
    public async Task Other_admins_wrong_leases_and_cancelled_jobs_cannot_be_used()
    {
        using var f = new Fixture();
        var job = await f.Service.StartAsync(7, Owner);
        var lease = (await f.Service.ClaimAsync())!;
        await Assert.ThrowsAsync<KeyNotFoundException>(() => f.Service.GetAsync(7, job.Id, "other@example.test"));
        await Assert.ThrowsAsync<KeyNotFoundException>(() => f.Service.CancelAsync(7, job.Id, "other@example.test"));
        await Assert.ThrowsAsync<InvalidOperationException>(() => f.Service.CompleteAsync(job.Id, new string('x', 64), Png()));
        await f.Service.CancelAsync(7, job.Id, Owner);
        await Assert.ThrowsAsync<InvalidOperationException>(() => f.Service.CompleteAsync(job.Id, lease.LeaseToken, Png()));
    }

    [Fact]
    public async Task Active_requests_are_reused_and_a_lease_cannot_be_claimed_twice()
    {
        using var f = new Fixture();
        var job = await f.Service.StartAsync(7, Owner);
        Assert.Equal(job.Id, (await f.Service.StartAsync(7, Owner)).Id);
        Assert.NotNull(await f.Service.ClaimAsync());
        Assert.Null(await f.Service.ClaimAsync());
        await f.Service.CancelAsync(7, job.Id, Owner);
        Assert.NotEqual(job.Id, (await f.Service.StartAsync(7, Owner)).Id);
    }

    [Fact]
    public async Task Expiry_and_cleanup_remove_temporary_images_and_release_active_slots()
    {
        using var f = new Fixture();
        var job = await f.Ready();
        f.Clock.Advance(TimeSpan.FromMinutes(11));
        await f.Service.CleanupAsync();
        Assert.Equal("failed", (await f.Service.GetAsync(7, job.Id, Owner)).Status);
        Assert.Empty(Directory.GetFiles(Path.Combine(f.Root, ".template-captures")));
        f.Service.Heartbeat();
        Assert.NotEqual(job.Id, (await f.Service.StartAsync(7, Owner)).Id);
    }

    [Fact]
    public async Task Invalid_images_and_render_failure_never_touch_the_thumbnail()
    {
        using var f = new Fixture();
        var job = await f.Service.StartAsync(7, Owner);
        var lease = (await f.Service.ClaimAsync())!;
        await Assert.ThrowsAsync<ArgumentException>(() => f.Service.CompleteAsync(job.Id, lease.LeaseToken, Png(500)));
        await f.Service.FailAsync(job.Id, lease.LeaseToken);
        Assert.Equal("failed", (await f.Service.GetAsync(7, job.Id, Owner)).Status);
        Assert.Equal(0, f.Sink.Calls);
    }

    private sealed class Fixture : IDisposable
    {
        public TestDb Db { get; } = new();
        public string Root { get; } = Path.Combine(Path.GetTempPath(), "capture-test-" + Guid.NewGuid());
        public FakeClock Clock { get; } = new();
        public ThumbnailSink Sink { get; }
        public TemplateConfigDefaultRepository Defaults { get; }
        public TemplateStudioService Studio { get; }
        public TemplateCaptureService Service { get; }
        public Fixture(bool online = true, bool configured = true)
        {
            var repo = new TemplateRepository(Db.Context);
            Sink = new ThumbnailSink(repo);
            Defaults = new(Db.Context);
            var configs = new TemplateConfigService(new TemplateConfigRepository(Db.Context), Defaults, new EventRepository(Db.Context));
            Studio = new TemplateStudioService(Db.Context, configs);
            var presence = new CaptureWorkerPresence();
            if (online) presence.Touch(Clock.GetUtcNow().UtcDateTime);
            var configuration = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?> { ["TemplateCapture:WorkerKey"] = configured ? new string('k', 64) : null }).Build();
            Service = new(Db.Context, Studio, Sink, new Env { ContentRootPath = Root }, configuration, presence, NullLogger<TemplateCaptureService>.Instance, Clock);
        }
        public async Task<CaptureJobDto> Ready()
        {
            var job = await Service.StartAsync(7, Owner);
            var lease = (await Service.ClaimAsync())!;
            await Service.CompleteAsync(job.Id, lease.LeaseToken, Png());
            return await Service.GetAsync(7, job.Id, Owner);
        }
        public void Dispose() { Db.Dispose(); if (Directory.Exists(Root)) Directory.Delete(Root, true); }
    }

    private class ThumbnailSink : TemplateService, ITemplateService
    {
        private readonly ITemplateRepository repo;
        public ThumbnailSink(ITemplateRepository repository) : base(repository) { repo = repository; }
        public int Calls { get; private set; }
        public bool PreservedPrevious { get; private set; }
        public new async Task<TemplateDto> SetThumbnailAsync(int id, IFormFile file, bool preservePrevious = false)
        {
            Calls++; PreservedPrevious = preservePrevious;
            var template = (await repo.GetByIdAsync(id))!;
            template.ThumbnailUrl = "/uploads/templates/capture-test.png";
            await repo.UpdateAsync(template);
            return new TemplateDto { TemplateId = id, ThumbnailUrl = template.ThumbnailUrl };
        }
    }
    private class FakeClock : TimeProvider
    {
        private DateTimeOffset now = new(2026, 11, 3, 0, 0, 0, TimeSpan.Zero);
        public override DateTimeOffset GetUtcNow() => now;
        public void Advance(TimeSpan duration) => now += duration;
    }
    private class Env : IWebHostEnvironment
    {
        public string WebRootPath { get; set; } = "";
        public IFileProvider WebRootFileProvider { get; set; } = new NullFileProvider();
        public string ApplicationName { get; set; } = "Tests";
        public string EnvironmentName { get; set; } = "Testing";
        public string ContentRootPath { get; set; } = "";
        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }
}
