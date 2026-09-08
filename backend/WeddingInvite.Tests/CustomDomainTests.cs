using WeddingInvite.Core.Constants;
using WeddingInvite.Core.Services;
using WeddingInvite.Data.Repositories;
using WeddingInvite.Models;
using Xunit;

namespace WeddingInvite.Tests;

/// <summary>
/// Custom domain is a PRO-tier perk (see TierEnforcementTests for the tier + per-event
/// toggle gate itself): once enabled, a domain is normalized, validated, and globally unique.
/// These tests pin that contract.
/// </summary>
public class CustomDomainTests
{
    private static EventService BuildService(TestDb db) => new(
        new EventRepository(db.Context),
        new GuestRepository(db.Context),
        new PackageRepository(db.Context),
        new EventFeatureRepository(db.Context),
        new TemplateRepository(db.Context),
        new UserRepository(db.Context));

    private const int CustomDomainFeatureId = 3; // seeded CUSTOM_DOMAIN

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

    // Custom domain needs the tier AND an explicit per-event toggle (same as PHOTO_BOOTH/
    // SEATING) — tests that aren't specifically about the toggle itself enable it directly here.
    private static void EnableCustomDomain(TestDb db, int eventId)
    {
        db.Context.EventFeatures.Add(new EventFeature { EventId = eventId, FeatureId = CustomDomainFeatureId, IsEnabled = true });
        db.Context.SaveChanges();
    }

    [Theory]
    [InlineData("BASIC")]
    [InlineData("PREMIUM")]
    public async Task NonPro_CannotSetDomain(string tier)
    {
        using var db = new TestDb();
        SeedCouple(db, 200, tier);
        var svc = BuildService(db);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            svc.SetDomainAsync(200, "john-and-mary.com"));
    }

    [Fact]
    public async Task Pro_CanSetDomain_AndItIsNormalized()
    {
        using var db = new TestDb();
        SeedCouple(db, 201, TierEntitlements.Pro);
        EnableCustomDomain(db, 201);
        var svc = BuildService(db);

        var result = await svc.SetDomainAsync(201, "https://WWW.John-And-Mary.COM/");
        Assert.Equal("john-and-mary.com", result.Domain);
    }

    [Fact]
    public async Task InvalidDomain_IsRejected()
    {
        using var db = new TestDb();
        SeedCouple(db, 202, TierEntitlements.Pro);
        var svc = BuildService(db);

        await Assert.ThrowsAsync<ArgumentException>(() =>
            svc.SetDomainAsync(202, "not a domain"));
    }

    [Fact]
    public async Task Domain_MustBeUnique()
    {
        using var db = new TestDb();
        SeedCouple(db, 203, TierEntitlements.Pro);
        SeedCouple(db, 204, TierEntitlements.Pro);
        EnableCustomDomain(db, 203);
        EnableCustomDomain(db, 204);
        var svc = BuildService(db);

        await svc.SetDomainAsync(203, "shared.com");
        await Assert.ThrowsAsync<ArgumentException>(() =>
            svc.SetDomainAsync(204, "shared.com"));
    }

    [Fact]
    public async Task ClearingDomain_IsAllowed_OnAnyTier()
    {
        using var db = new TestDb();
        SeedCouple(db, 205, TierEntitlements.Basic);
        var svc = BuildService(db);

        var result = await svc.SetDomainAsync(205, null);
        Assert.Null(result.Domain);
    }

    [Fact]
    public async Task GetByDomain_ResolvesTheEvent()
    {
        using var db = new TestDb();
        SeedCouple(db, 206, TierEntitlements.Pro);
        EnableCustomDomain(db, 206);
        var svc = BuildService(db);
        await svc.SetDomainAsync(206, "resolve-me.com");

        // Lookup normalizes the incoming host too.
        var found = await svc.GetByDomainAsync("WWW.Resolve-Me.com");
        Assert.NotNull(found);
        Assert.Equal(206, found!.EventId);
    }
}
