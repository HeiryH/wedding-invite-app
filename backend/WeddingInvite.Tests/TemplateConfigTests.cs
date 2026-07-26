using WeddingInvite.Core.Config;
using WeddingInvite.Core.Services;
using WeddingInvite.Data.Repositories;
using WeddingInvite.Models;
using Xunit;

namespace WeddingInvite.Tests;

/// <summary>
/// The config bag is a whole-bag PUT: the customize page sends every key it knows about, and any
/// stored key it omits is pruned. That makes deletion work (a removed layer's key simply stops being
/// sent) but it also means a bug here silently destroys a couple's content. These tests pin both the
/// pruning boundary and the admin-only write policy.
/// </summary>
public class TemplateConfigTests
{
    private const int WeddingId = 1;

    private static TestDb SeedWedding()
    {
        var db = new TestDb();
        db.Context.Weddings.Add(new Wedding
        {
            WeddingId = WeddingId,
            CoupleName = "ali-and-siti",
            BrideName = "Siti",
            GroomName = "Ali",
            WeddingDate = new DateTime(2026, 12, 1),
            Venue = "Empire",
            TemplateId = 7,
        });
        db.Context.SaveChanges();
        return db;
    }

    private static TemplateConfigService ServiceFor(TestDb db) =>
        new(new TemplateConfigRepository(db.Context), new TemplateConfigDefaultRepository(db.Context),
            new WeddingRepository(db.Context));

    private static Dictionary<string, string> Bag(params (string Key, string Value)[] pairs) =>
        pairs.ToDictionary(p => p.Key, p => p.Value, StringComparer.Ordinal);

    // ── Write policy ───────────────────────────────────────────────────────────

    [Theory]
    [InlineData("section.order", false)] // couples reorder their own sections via the rail
    [InlineData("nav.welcome", true)]
    [InlineData("scene.environment", true)]
    [InlineData("t7.layout.mobile.welcome", false)] // couples author their own stage layouts
    [InlineData("t7.layout.desktop.ceremony-details", false)]
    [InlineData("invite.body", false)]
    [InlineData("walimah.body", false)]
    [InlineData("music.url", false)]
    [InlineData("scene.parallax", false)]
    public void IsAdminOnly_ClassifiesKeys(string key, bool expected)
    {
        Assert.Equal(expected, TemplateConfigPolicy.IsAdminOnly(key));
    }

    [Theory]
    [InlineData("t5.layout.mobile.welcome", true)]
    [InlineData("t7.layout.desktop.ceremony-details", true)]
    [InlineData("t12.layout.mobile.x", true)]
    [InlineData("t7.layout", false)]        // needs the trailing segment
    [InlineData("nav.layout.thing", false)] // only the t<N>.layout. namespace counts
    [InlineData("invite.body", false)]
    public void IsLayoutKey_MatchesEveryTemplateLayoutNamespace(string key, bool expected)
    {
        Assert.Equal(expected, TemplateConfigPolicy.IsLayoutKey(key));
    }

    [Fact]
    public void CanWrite_SuperAdminMayWriteAnything()
    {
        Assert.True(TemplateConfigPolicy.CanWrite("nav.rsvp", UserRoles.SuperAdmin, tier: null));
        Assert.True(TemplateConfigPolicy.CanWrite("t7.layout.mobile.welcome", UserRoles.SuperAdmin, tier: "FREE"));
    }

    [Fact]
    public void CanWrite_LayoutKeysRequireProTier()
    {
        // The Adjust panel is a PRO feature.
        Assert.True(TemplateConfigPolicy.CanWrite("t7.layout.mobile.welcome", UserRoles.CoupleAdmin, "PRO"));
        Assert.False(TemplateConfigPolicy.CanWrite("t7.layout.mobile.welcome", UserRoles.CoupleAdmin, "PREMIUM"));
        Assert.False(TemplateConfigPolicy.CanWrite("t7.layout.mobile.welcome", UserRoles.CoupleAdmin, "FREE"));
        Assert.False(TemplateConfigPolicy.CanWrite("t7.layout.mobile.welcome", UserRoles.CoupleAdmin, null));
    }

    [Fact]
    public void CanWrite_NonLayoutKeysIgnoreTier()
    {
        // A couple on any tier can still edit ordinary content.
        Assert.True(TemplateConfigPolicy.CanWrite("invite.body", UserRoles.CoupleAdmin, "FREE"));
        // handleSave writes section.order every save; a tier gate here would silently drop reorders.
        Assert.True(TemplateConfigPolicy.CanWrite("section.order", UserRoles.CoupleAdmin, "FREE"));
    }

    [Theory]
    [InlineData(UserRoles.CoupleAdmin)]
    [InlineData(UserRoles.HostAdmin)]
    public void CanWrite_NonAdminBlockedFromAdminKeys(string role)
    {
        Assert.False(TemplateConfigPolicy.CanWrite("nav.rsvp", role, "PRO"));
        Assert.True(TemplateConfigPolicy.CanWrite("invite.body", role, "PRO"));
    }

    // ── Validation ─────────────────────────────────────────────────────────────

    [Fact]
    public void Validate_AcceptsARealisticBag()
    {
        var bag = Bag(
            ("invite.body", new string('x', 900)),
            ("t7.layout.mobile.welcome", new string('{', 3_800)));

        Assert.Null(TemplateConfigPolicy.Validate(bag));
    }

    [Fact]
    public void Validate_RejectsOversizedValue()
    {
        var bag = Bag(("t7.layout.mobile.welcome", new string('x', 5_000)));
        Assert.Contains("exceeds 4000", TemplateConfigPolicy.Validate(bag));
    }

    [Fact]
    public void Validate_RejectsMalformedKey()
    {
        Assert.Contains("outside", TemplateConfigPolicy.Validate(Bag(("invite body!", "x"))));
    }

    [Fact]
    public void Validate_RejectsOversizedBag()
    {
        var bag = Enumerable.Range(0, 401)
            .ToDictionary(i => $"k{i}", _ => "v", StringComparer.Ordinal);

        Assert.Contains("Too many config keys", TemplateConfigPolicy.Validate(bag));
    }

    // ── Pruning ────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Save_PrunesKeysTheCallerOmitted()
    {
        using var db = SeedWedding();
        var svc = ServiceFor(db);

        await svc.SaveConfigAsync(WeddingId, Bag(
            ("invite.body", "hello"),
            ("wish.prompt", "leave a note")), UserRoles.CoupleAdmin, "PRO");

        // Second save drops wish.prompt — e.g. the couple switched to a template without it.
        await svc.SaveConfigAsync(WeddingId, Bag(("invite.body", "hello")), UserRoles.CoupleAdmin, "PRO");

        var stored = await svc.GetConfigAsync(WeddingId);
        Assert.Equal("hello", stored["invite.body"]);
        Assert.DoesNotContain("wish.prompt", stored.Keys);
    }

    [Fact]
    public async Task Save_CoupleCannotPruneAdminKeys()
    {
        using var db = SeedWedding();
        var svc = ServiceFor(db);

        await svc.SaveConfigAsync(WeddingId, Bag(
            ("scene.environment", "night"),
            ("nav.rsvp", "Reply")), UserRoles.SuperAdmin, "PRO");

        // A couple saves a bag that mentions neither admin key. Both must survive.
        await svc.SaveConfigAsync(WeddingId, Bag(("invite.body", "hi")), UserRoles.CoupleAdmin, "PRO");

        var stored = await svc.GetConfigAsync(WeddingId);
        Assert.Equal("night", stored["scene.environment"]);
        Assert.Equal("Reply", stored["nav.rsvp"]);
        Assert.Equal("hi", stored["invite.body"]);
    }

    [Fact]
    public async Task Save_CoupleCannotOverwriteAdminKeys()
    {
        using var db = SeedWedding();
        var svc = ServiceFor(db);

        await svc.SaveConfigAsync(
            WeddingId, Bag(("nav.rsvp", "ADMIN")), UserRoles.SuperAdmin, "PRO");

        await svc.SaveConfigAsync(
            WeddingId, Bag(("nav.rsvp", "HIJACKED")), UserRoles.CoupleAdmin, "PRO");

        var stored = await svc.GetConfigAsync(WeddingId);
        Assert.Equal("ADMIN", stored["nav.rsvp"]);
    }

    [Fact]
    public async Task Save_CoupleCanEditAndResetTheirOwnLayout()
    {
        using var db = SeedWedding();
        var svc = ServiceFor(db);

        await svc.SaveConfigAsync(
            WeddingId, Bag(("t7.layout.mobile.welcome", "{\"layers\":[{\"id\":\"arch\",\"y\":40}]}")),
            UserRoles.CoupleAdmin, "PRO");

        var afterEdit = await svc.GetConfigAsync(WeddingId);
        Assert.Equal("{\"layers\":[{\"id\":\"arch\",\"y\":40}]}", afterEdit["t7.layout.mobile.welcome"]);

        // Resetting the stage back to its defaults is expressed by omitting the key — which prunes it.
        await svc.SaveConfigAsync(WeddingId, Bag(("invite.body", "hi")), UserRoles.CoupleAdmin, "PRO");

        var afterReset = await svc.GetConfigAsync(WeddingId);
        Assert.DoesNotContain("t7.layout.mobile.welcome", afterReset.Keys);
    }

    [Theory]
    [InlineData("FREE")]
    [InlineData("PREMIUM")]
    public async Task Save_SubProLayoutKeyIsDroppedButOtherKeysSave(string tier)
    {
        using var db = SeedWedding();
        var svc = ServiceFor(db);

        // A sub-PRO couple's bag carries a layout key (e.g. a stale draft) alongside real content.
        await svc.SaveConfigAsync(WeddingId, Bag(
            ("invite.body", "hello"),
            ("t7.layout.mobile.welcome", "{\"layers\":[{\"id\":\"arch\",\"y\":40}]}")),
            UserRoles.CoupleAdmin, tier);

        var stored = await svc.GetConfigAsync(WeddingId);
        Assert.Equal("hello", stored["invite.body"]);          // ordinary content still saves
        Assert.DoesNotContain("t7.layout.mobile.welcome", stored.Keys); // layout key dropped
    }

    [Fact]
    public async Task Save_DowngradedCoupleCannotPruneExistingLayout()
    {
        using var db = SeedWedding();
        var svc = ServiceFor(db);

        // Authored while PRO…
        await svc.SaveConfigAsync(WeddingId, Bag(("t7.layout.mobile.welcome", "{}")), UserRoles.CoupleAdmin, "PRO");

        // …then the couple is downgraded and saves a bag that omits the layout key. It must NOT be
        // pruned — the layout still renders on the public page, they just can't edit it.
        await svc.SaveConfigAsync(WeddingId, Bag(("invite.body", "hi")), UserRoles.CoupleAdmin, "FREE");

        var stored = await svc.GetConfigAsync(WeddingId);
        Assert.Equal("{}", stored["t7.layout.mobile.welcome"]);
        Assert.Equal("hi", stored["invite.body"]);
    }

    [Fact]
    public async Task Save_IsIdempotent()
    {
        using var db = SeedWedding();
        var svc = ServiceFor(db);
        var bag = Bag(("invite.body", "hello"), ("music.url", "/uploads/song.mp3"));

        await svc.SaveConfigAsync(WeddingId, bag, UserRoles.CoupleAdmin, "PRO");
        await svc.SaveConfigAsync(WeddingId, bag, UserRoles.CoupleAdmin, "PRO");

        var rows = db.Fresh().TemplateConfigs.Where(c => c.WeddingId == WeddingId).ToList();
        Assert.Equal(2, rows.Count); // no duplicate rows from the unique (WeddingId, ConfigKey) index
    }
}
