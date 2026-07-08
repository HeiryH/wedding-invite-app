using WeddingInvite.Core.Constants;
using WeddingInvite.Core.Services;
using WeddingInvite.Data.Repositories;
using WeddingInvite.Models;
using Xunit;

namespace WeddingInvite.Tests;

/// <summary>
/// Custom domain is the PRO-tier perk: only a PRO wedding may set one, it is normalized,
/// validated, and globally unique. These tests pin that contract.
/// </summary>
public class CustomDomainTests
{
    private static WeddingService BuildService(TestDb db) => new(
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

    [Theory]
    [InlineData("FREE")]
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
        var svc = BuildService(db);

        await svc.SetDomainAsync(203, "shared.com");
        await Assert.ThrowsAsync<ArgumentException>(() =>
            svc.SetDomainAsync(204, "shared.com"));
    }

    [Fact]
    public async Task ClearingDomain_IsAllowed_OnAnyTier()
    {
        using var db = new TestDb();
        SeedCouple(db, 205, TierEntitlements.Free);
        var svc = BuildService(db);

        var result = await svc.SetDomainAsync(205, null);
        Assert.Null(result.Domain);
    }

    [Fact]
    public async Task GetByDomain_ResolvesTheWedding()
    {
        using var db = new TestDb();
        SeedCouple(db, 206, TierEntitlements.Pro);
        var svc = BuildService(db);
        await svc.SetDomainAsync(206, "resolve-me.com");

        // Lookup normalizes the incoming host too.
        var found = await svc.GetByDomainAsync("WWW.Resolve-Me.com");
        Assert.NotNull(found);
        Assert.Equal(206, found!.WeddingId);
    }
}
