using WeddingInvite.Core.DTOs;
using WeddingInvite.Core.Services;
using WeddingInvite.Data.Repositories;
using WeddingInvite.Models;
using Xunit;

namespace WeddingInvite.Tests;

/// <summary>
/// Per-template "starting design": a super-admin captures a finished invite's visual config as the
/// template default, and every invite of that template inherits it **live at read time** for any key
/// the couple hasn't overridden. These tests pin the capture filter (couple content excluded), the
/// read-time merge, live propagation of default changes, and the delta-only save.
/// </summary>
public class TemplateDefaultConfigTests
{
    private const int TemplateId = 7;

    private static TemplateConfigService ConfigService(TestDb db) => new(
        new TemplateConfigRepository(db.Context),
        new TemplateConfigDefaultRepository(db.Context),
        new EventRepository(db.Context));

    private static EventService EventSvc(TestDb db) => new(
        new EventRepository(db.Context),
        new GuestRepository(db.Context),
        new PackageRepository(db.Context),
        new EventFeatureRepository(db.Context),
        new TemplateRepository(db.Context),
        new UserRepository(db.Context));

    private static int SeedWedding(TestDb db, string coupleName, int templateId, string tier = "PRO")
    {
        var w = new Event
        {
            Slug = coupleName,
            Name1 = "B", Name2 = "G",
            EventDate = new DateTime(2027, 12, 1),
            Venue = "V",
            TemplateId = templateId,
        };
        db.Context.Events.Add(w);
        db.Context.SaveChanges();
        db.Context.Users.Add(new User
        {
            Email = $"{coupleName}@x.com", PasswordHash = "x", Role = UserRoles.OrganizerAdmin,
            EventId = w.EventId, Tier = tier,
        });
        db.Context.SaveChanges();
        return w.EventId;
    }

    [Fact]
    public async Task Capture_KeepsDesign_DropsCoupleContent()
    {
        using var db = new TestDb();
        var sourceId = SeedWedding(db, "source", TemplateId);
        var svc = ConfigService(db);

        await svc.SaveConfigAsync(sourceId, new()
        {
            ["t7.layout.mobile.welcome"] = "{\"layers\":[{\"id\":\"arch\",\"y\":40}]}",
            ["scene.ink.tint"] = "#2b2621",
            ["nav.rsvp"] = "Reply",
            ["invite.body"] = "Ali weds Siti — our story…",   // couple content → dropped
            ["walimah.body"] = "Join our walimah",              // couple content → dropped
            ["music.url"] = "/uploads/their-song.mp3",          // couple content → dropped
        }, UserRoles.SuperAdmin, "PRO");

        await svc.SetDefaultFromWeddingAsync(TemplateId, sourceId);

        var def = await svc.GetDefaultAsync(TemplateId);
        Assert.Equal("{\"layers\":[{\"id\":\"arch\",\"y\":40}]}", def["t7.layout.mobile.welcome"]);
        Assert.Equal("#2b2621", def["scene.ink.tint"]);
        Assert.Equal("Reply", def["nav.rsvp"]);
        Assert.DoesNotContain("invite.body", def.Keys);
        Assert.DoesNotContain("walimah.body", def.Keys);
        Assert.DoesNotContain("music.url", def.Keys);
    }

    [Fact]
    public async Task Invite_InheritsTemplateDefault_AtReadTime()
    {
        using var db = new TestDb();
        var svc = ConfigService(db);

        var sourceId = SeedWedding(db, "source", TemplateId);
        await svc.SaveConfigAsync(sourceId, new()
        {
            ["t7.layout.mobile.welcome"] = "{\"layers\":[{\"id\":\"arch\",\"y\":40}]}",
            ["scene.ink.tint"] = "#2b2621",
        }, UserRoles.SuperAdmin, "PRO");
        await svc.SetDefaultFromWeddingAsync(TemplateId, sourceId);

        // A brand-new invite on t7 with NO rows of its own still resolves the default.
        var other = SeedWedding(db, "other", TemplateId);
        var effective = await svc.GetConfigAsync(other);
        Assert.Equal("{\"layers\":[{\"id\":\"arch\",\"y\":40}]}", effective["t7.layout.mobile.welcome"]);
        Assert.Equal("#2b2621", effective["scene.ink.tint"]);
    }

    [Fact]
    public async Task SwitchingTemplate_MakesInviteInheritDefault_WithoutSeedingRows()
    {
        using var db = new TestDb();
        var svc = ConfigService(db);

        var sourceId = SeedWedding(db, "source", TemplateId);
        await svc.SaveConfigAsync(sourceId, new() { ["scene.ink.tint"] = "#2b2621" }, UserRoles.SuperAdmin, "PRO");
        await svc.SetDefaultFromWeddingAsync(TemplateId, sourceId);

        // An existing invite on template 1 → empty effective config.
        var target = SeedWedding(db, "switcher", 1);
        Assert.Empty(await svc.GetConfigAsync(target));

        // Switch it to t7 → it now inherits the t7 default, without any seeded rows being written.
        await EventSvc(db).UpdateTemplateAsync(target, TemplateId);

        var effective = await svc.GetConfigAsync(target);
        Assert.Equal("#2b2621", effective["scene.ink.tint"]);
        Assert.Empty(await new TemplateConfigRepository(db.Fresh()).GetByEventIdAsync(target)); // no rows
    }

    [Fact]
    public async Task CoupleOverride_WinsOverDefault_AndSurvivesDefaultChange()
    {
        using var db = new TestDb();
        var svc = ConfigService(db);

        var sourceId = SeedWedding(db, "source", TemplateId);
        await svc.SaveConfigAsync(sourceId, new() { ["scene.ink.tint"] = "#2b2621" }, UserRoles.SuperAdmin, "PRO");
        await svc.SetDefaultFromWeddingAsync(TemplateId, sourceId);

        var invite = SeedWedding(db, "invite", TemplateId);
        await svc.SaveConfigAsync(invite, new() { ["scene.ink.tint"] = "#111111" }, UserRoles.OrganizerAdmin, "PRO");

        Assert.Equal("#111111", (await svc.GetConfigAsync(invite))["scene.ink.tint"]); // override wins

        // Improve the default; the couple's explicit override is unaffected.
        await svc.SaveConfigAsync(sourceId, new() { ["scene.ink.tint"] = "#333333" }, UserRoles.SuperAdmin, "PRO");
        await svc.SetDefaultFromWeddingAsync(TemplateId, sourceId);
        Assert.Equal("#111111", (await svc.GetConfigAsync(invite))["scene.ink.tint"]);
    }

    [Fact]
    public async Task DefaultChange_PropagatesLive_ToUnoverriddenKeys()
    {
        using var db = new TestDb();
        var svc = ConfigService(db);

        var sourceId = SeedWedding(db, "source", TemplateId);
        await svc.SaveConfigAsync(sourceId, new() { ["scene.ink.tint"] = "#2b2621" }, UserRoles.SuperAdmin, "PRO");
        await svc.SetDefaultFromWeddingAsync(TemplateId, sourceId);

        var invite = SeedWedding(db, "invite", TemplateId); // never edits scene.ink.tint
        Assert.Equal("#2b2621", (await svc.GetConfigAsync(invite))["scene.ink.tint"]);

        // Refine the default → the untouched invite immediately shows the new value (no re-seed).
        await svc.SaveConfigAsync(sourceId, new() { ["scene.ink.tint"] = "#444444" }, UserRoles.SuperAdmin, "PRO");
        await svc.SetDefaultFromWeddingAsync(TemplateId, sourceId);
        Assert.Equal("#444444", (await svc.GetConfigAsync(invite))["scene.ink.tint"]);
    }

    [Fact]
    public async Task Save_DoesNotPersistKeysEqualToDefault()
    {
        using var db = new TestDb();
        var svc = ConfigService(db);

        var sourceId = SeedWedding(db, "source", TemplateId);
        await svc.SaveConfigAsync(sourceId, new() { ["scene.ink.tint"] = "#2b2621" }, UserRoles.SuperAdmin, "PRO");
        await svc.SetDefaultFromWeddingAsync(TemplateId, sourceId);

        var invite = SeedWedding(db, "invite", TemplateId);
        // The editor echoes the whole (merged) bag back, including the default value it inherited.
        await svc.SaveConfigAsync(invite, new()
        {
            ["scene.ink.tint"] = "#2b2621", // equals default → must NOT be stored (stays live)
            ["invite.heading"] = "Custom heading", // a real override → stored
        }, UserRoles.OrganizerAdmin, "PRO");

        var rows = new TemplateConfigRepository(db.Fresh()).GetByEventIdAsync(invite).Result.ToList();
        Assert.DoesNotContain(rows, r => r.ConfigKey == "scene.ink.tint");
        Assert.Contains(rows, r => r.ConfigKey == "invite.heading");
    }

    [Fact]
    public async Task ClearDefault_RemovesInheritance()
    {
        using var db = new TestDb();
        var svc = ConfigService(db);

        var sourceId = SeedWedding(db, "source", TemplateId);
        await svc.SaveConfigAsync(sourceId, new() { ["scene.ink.tint"] = "#2b2621" }, UserRoles.SuperAdmin, "PRO");
        await svc.SetDefaultFromWeddingAsync(TemplateId, sourceId);

        var invite = SeedWedding(db, "invite", TemplateId);
        Assert.Equal("#2b2621", (await svc.GetConfigAsync(invite))["scene.ink.tint"]);

        await svc.ClearDefaultAsync(TemplateId);
        Assert.DoesNotContain("scene.ink.tint", (await svc.GetConfigAsync(invite)).Keys);
    }
}
