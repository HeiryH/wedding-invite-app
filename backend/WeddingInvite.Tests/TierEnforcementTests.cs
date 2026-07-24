using WeddingInvite.Core.Constants;
using WeddingInvite.Core.DTOs;
using WeddingInvite.Core.Services;
using WeddingInvite.Data.Repositories;
using WeddingInvite.Models;
using Xunit;

namespace WeddingInvite.Tests;

/// <summary>
/// Tier is a real, server-enforced entitlement: a wedding may not enable a feature
/// above the tier of its couple admin. These tests pin the ceiling so it can't
/// silently regress to a frontend-only gate.
/// </summary>
public class TierEnforcementTests
{
    // ── Package-driven entitlement lookup (replaces the old hardcoded FeatureMinRank dict) ────
    [Theory]
    [InlineData("FREE", "RSVP", true)]
    [InlineData("FREE", "WISHES", true)]
    [InlineData("FREE", "PHOTO_BOOTH", false)]
    [InlineData("FREE", "SEATING", false)]
    [InlineData("FREE", "CUSTOM_DOMAIN", false)]
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
    [InlineData("FREE", "PREMIUM", false)]
    [InlineData("PREMIUM", "PREMIUM", true)]
    [InlineData("PREMIUM", "FREE", true)]
    [InlineData("PRO", "PREMIUM", true)]
    public void AllowsTemplateTier_RespectsRank(string userTier, string templateTier, bool expected)
    {
        Assert.Equal(expected, TierEntitlements.AllowsTemplateTier(userTier, templateTier));
    }

    // ── End-to-end through the service + repositories ──────────────────────────
    private static WeddingFeatureService BuildService(TestDb db) => new(
        new WeddingFeatureRepository(db.Context),
        new WeddingRepository(db.Context),
        new FeatureRepository(db.Context),
        new UserRepository(db.Context),
        new PackageRepository(db.Context));

    private static WeddingService BuildWeddingService(TestDb db) => new(
        new WeddingRepository(db.Context),
        new GuestRepository(db.Context),
        new PackageRepository(db.Context),
        new WeddingFeatureRepository(db.Context),
        new TemplateRepository(db.Context),
        new UserRepository(db.Context));

    private static void SeedCouple(TestDb db, int weddingId, string tier)
    {
        db.Context.Weddings.Add(new Wedding { WeddingId = weddingId, CoupleName = $"w{weddingId}", TemplateId = 1 });
        db.Context.Users.Add(new User
        {
            Email = $"c{weddingId}@x.com",
            PasswordHash = "x",
            Role = UserRoles.CoupleAdmin,
            WeddingId = weddingId,
            Tier = tier,
        });
        db.Context.SaveChanges();
    }

    private const int PhotoBoothFeatureId = 1;  // seeded PHOTO_BOOTH
    private const int CustomDomainFeatureId = 3; // seeded CUSTOM_DOMAIN
    private const int RsvpFeatureId = 4;        // seeded RSVP (FREE)

    [Fact]
    public async Task FreeWedding_CannotEnable_PremiumFeature()
    {
        using var db = new TestDb();
        SeedCouple(db, 100, TierEntitlements.Free);
        var svc = BuildService(db);

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            svc.ToggleFeatureAsync(100, new ToggleFeatureDto { FeatureId = PhotoBoothFeatureId, IsEnabled = true }));
        Assert.Contains("FREE", ex.Message);
    }

    [Fact]
    public async Task FreeWedding_CanEnable_FreeFeature()
    {
        using var db = new TestDb();
        SeedCouple(db, 101, TierEntitlements.Free);
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
        SeedCouple(db, 103, TierEntitlements.Free);
        var svc = BuildService(db);

        // Disabling a premium feature must never be blocked by the ceiling.
        var result = await svc.ToggleFeatureAsync(103, new ToggleFeatureDto { FeatureId = PhotoBoothFeatureId, IsEnabled = false });
        Assert.False(result.IsEnabled);
    }

    // ── Custom domain: tier ceiling AND explicit per-wedding toggle (same two-step gate) ───────
    [Fact]
    public async Task PremiumWedding_CannotSetDomain_NotOnTier()
    {
        using var db = new TestDb();
        SeedCouple(db, 104, TierEntitlements.Premium);
        var weddingSvc = BuildWeddingService(db);

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            weddingSvc.SetDomainAsync(104, "example.com"));
        Assert.Contains("PRO", ex.Message);
    }

    [Fact]
    public async Task ProWedding_CannotSetDomain_UntilToggleIsEnabled()
    {
        using var db = new TestDb();
        SeedCouple(db, 105, TierEntitlements.Pro);
        var weddingSvc = BuildWeddingService(db);

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
        var weddingSvc = BuildWeddingService(db);

        await featureSvc.ToggleFeatureAsync(106, new ToggleFeatureDto { FeatureId = CustomDomainFeatureId, IsEnabled = true });

        var updated = await weddingSvc.SetDomainAsync(106, "example.com");
        Assert.Equal("example.com", updated.Domain);
    }
}
