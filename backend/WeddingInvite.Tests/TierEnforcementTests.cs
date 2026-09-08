using WeddingInvite.Core.Constants;
using WeddingInvite.Core.DTOs;
using WeddingInvite.Core.Services;
using WeddingInvite.Data.Repositories;
using WeddingInvite.Models;
using Xunit;

namespace WeddingInvite.Tests;

/// <summary>
/// Tier is a real, server-enforced entitlement: an event may not enable a feature
/// above the tier of its couple admin. These tests pin the ceiling so it can't
/// silently regress to a frontend-only gate.
/// </summary>
public class TierEnforcementTests
{
    // ── Package-driven entitlement lookup (replaces the old hardcoded FeatureMinRank dict) ────
    [Theory]
    [InlineData("BASIC", "RSVP", true)]
    [InlineData("BASIC", "WISHES", true)]
    [InlineData("BASIC", "PHOTO_BOOTH", false)]
    [InlineData("BASIC", "SEATING", false)]
    [InlineData("BASIC", "CUSTOM_DOMAIN", false)]
    [InlineData("PREMIUM", "PHOTO_BOOTH", true)]
    [InlineData("PREMIUM", "SEATING", true)]
    [InlineData("PREMIUM", "CUSTOM_DOMAIN", false)]
    [InlineData("PRO", "CUSTOM_DOMAIN", true)]
    [InlineData(null, "PHOTO_BOOTH", false)] // missing tier ⇒ no matching package
    public async Task TierIncludesFeature_RespectsPackageDefinition(string? tier, string code, bool expected)
    {
        using var db = new TestDb();
        var repo = new PackageRepository(db.Context);
        Assert.Equal(expected, await repo.TierIncludesFeatureAsync(tier, code));
    }

    [Theory]
    [InlineData("BASIC", "PREMIUM", false)]
    [InlineData("PREMIUM", "PREMIUM", true)]
    [InlineData("PREMIUM", "BASIC", true)]
    [InlineData("PRO", "PREMIUM", true)]
    public void AllowsTemplateTier_RespectsRank(string userTier, string templateTier, bool expected)
    {
        Assert.Equal(expected, TierEntitlements.AllowsTemplateTier(userTier, templateTier));
    }

    // ── End-to-end through the service + repositories ──────────────────────────
    private static EventFeatureService BuildService(TestDb db) => new(
        new EventFeatureRepository(db.Context),
        new EventRepository(db.Context),
        new FeatureRepository(db.Context),
        new UserRepository(db.Context),
        new PackageRepository(db.Context));

    private static EventService BuildEventService(TestDb db) => new(
        new EventRepository(db.Context),
        new GuestRepository(db.Context),
        new PackageRepository(db.Context),
        new EventFeatureRepository(db.Context),
        new TemplateRepository(db.Context),
        new UserRepository(db.Context));

    private static void SeedCouple(TestDb db, int eventId, string tier)
    {
        db.Context.Events.Add(new Event { EventId = eventId, Slug = $"w{eventId}", TemplateId = 1 });
        db.Context.Users.Add(new User
        {
            Email = $"c{eventId}@x.com",
            PasswordHash = "x",
            Role = UserRoles.OrganizerAdmin,
            EventId = eventId,
            Tier = tier,
        });
        db.Context.SaveChanges();
    }

    private const int PhotoBoothFeatureId = 1;  // seeded PHOTO_BOOTH
    private const int CustomDomainFeatureId = 3; // seeded CUSTOM_DOMAIN
    private const int RsvpFeatureId = 4;        // seeded RSVP (BASIC)

    [Fact]
    public async Task BasicWedding_CannotEnable_PremiumFeature()
    {
        using var db = new TestDb();
        SeedCouple(db, 100, TierEntitlements.Basic);
        var svc = BuildService(db);

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            svc.ToggleFeatureAsync(100, new ToggleFeatureDto { FeatureId = PhotoBoothFeatureId, IsEnabled = true }));
        Assert.Contains("BASIC", ex.Message);
    }

    [Fact]
    public async Task BasicWedding_CanEnable_BasicFeature()
    {
        using var db = new TestDb();
        SeedCouple(db, 101, TierEntitlements.Basic);
        var svc = BuildService(db);

        var result = await svc.ToggleFeatureAsync(101, new ToggleFeatureDto { FeatureId = RsvpFeatureId, IsEnabled = true });
        Assert.True(result.IsEnabled);
    }

    [Fact]
    public async Task PremiumWedding_CanEnable_PremiumFeature()
    {
        using var db = new TestDb();
        SeedCouple(db, 102, TierEntitlements.Premium);
        var svc = BuildService(db);

        var result = await svc.ToggleFeatureAsync(102, new ToggleFeatureDto { FeatureId = PhotoBoothFeatureId, IsEnabled = true });
        Assert.True(result.IsEnabled);
    }

    [Fact]
    public async Task Disabling_IsAlwaysAllowed_RegardlessOfTier()
    {
        using var db = new TestDb();
        SeedCouple(db, 103, TierEntitlements.Basic);
        var svc = BuildService(db);

        // Disabling a premium feature must never be blocked by the ceiling.
        var result = await svc.ToggleFeatureAsync(103, new ToggleFeatureDto { FeatureId = PhotoBoothFeatureId, IsEnabled = false });
        Assert.False(result.IsEnabled);
    }

    // ── Custom domain: tier ceiling AND explicit per-event toggle (same two-step gate) ───────
    [Fact]
    public async Task PremiumWedding_CannotSetDomain_NotOnTier()
    {
        using var db = new TestDb();
        SeedCouple(db, 104, TierEntitlements.Premium);
        var weddingSvc = BuildEventService(db);

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            weddingSvc.SetDomainAsync(104, "example.com"));
        Assert.Contains("PRO", ex.Message);
    }

    [Fact]
    public async Task ProWedding_CannotSetDomain_UntilToggleIsEnabled()
    {
        using var db = new TestDb();
        SeedCouple(db, 105, TierEntitlements.Pro);
        var weddingSvc = BuildEventService(db);

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            weddingSvc.SetDomainAsync(105, "example.com"));
        Assert.Contains("enabled", ex.Message);
    }

    [Fact]
    public async Task ProWedding_CanSetDomain_OnceToggleIsEnabled()
    {
        using var db = new TestDb();
        SeedCouple(db, 106, TierEntitlements.Pro);
        var featureSvc = BuildService(db);
        var weddingSvc = BuildEventService(db);

        await featureSvc.ToggleFeatureAsync(106, new ToggleFeatureDto { FeatureId = CustomDomainFeatureId, IsEnabled = true });

        var updated = await weddingSvc.SetDomainAsync(106, "example.com");
        Assert.Equal("example.com", updated.Domain);
    }
}
