using Microsoft.Extensions.Logging.Abstractions;
using WeddingInvite.Core.Services;
using WeddingInvite.Data.Repositories;
using WeddingInvite.Models;
using Xunit;

namespace WeddingInvite.Tests;

/// <summary>
/// Tenant-isolation is the security-critical invariant: a couple/host admin must never
/// reach a wedding that isn't theirs. These tests pin that behaviour.
/// </summary>
public class WeddingAuthorizationServiceTests : IDisposable
{
    private readonly TestDb _db = new();
    private readonly WeddingAuthorizationService _sut;

    public WeddingAuthorizationServiceTests()
    {
        _sut = new WeddingAuthorizationService(
            new UserRepository(_db.Context),
            new WeddingRepository(_db.Context),
            NullLogger<WeddingAuthorizationService>.Instance);
    }

    private (User user, Wedding wedding) SeedCoupleWithWedding(string email, int weddingId)
    {
        var wedding = new Wedding { WeddingId = weddingId, CoupleName = $"w{weddingId}", TemplateId = 1 };
        var user = new User { Email = email, PasswordHash = "x", Role = UserRoles.CoupleAdmin, WeddingId = weddingId };
        _db.Context.Weddings.Add(wedding);
        _db.Context.Users.Add(user);
        _db.Context.SaveChanges();
        return (user, wedding);
    }

    [Fact]
    public async Task CoupleAdmin_CanAccess_OwnWedding()
    {
        SeedCoupleWithWedding("couple@a.com", 100);
        Assert.True(await _sut.CanAccessWeddingAsync("couple@a.com", 100));
    }

    [Fact]
    public async Task CoupleAdmin_CannotAccess_OtherWedding()
    {
        SeedCoupleWithWedding("couple@a.com", 100);
        SeedCoupleWithWedding("couple@b.com", 200);
        // couple A must not reach wedding B — cross-tenant denial
        Assert.False(await _sut.CanAccessWeddingAsync("couple@a.com", 200));
    }

    [Fact]
    public async Task SuperAdmin_CanAccess_AnyWedding()
    {
        SeedCoupleWithWedding("couple@a.com", 100);
        _db.Context.Users.Add(new User { Email = "super@x.com", PasswordHash = "x", Role = UserRoles.SuperAdmin });
        _db.Context.SaveChanges();
        Assert.True(await _sut.CanAccessWeddingAsync("super@x.com", 100));
    }

    [Fact]
    public async Task HostAdmin_CanAccess_OwnedWedding_ButNotOthers()
    {
        var host = new User { Email = "host@x.com", PasswordHash = "x", Role = UserRoles.HostAdmin };
        var otherHost = new User { Email = "other-host@x.com", PasswordHash = "x", Role = UserRoles.HostAdmin };
        _db.Context.Users.AddRange(host, otherHost);
        _db.Context.SaveChanges();

        var owned = new Wedding { WeddingId = 300, CoupleName = "owned", TemplateId = 1, CreatedByUserId = host.UserId };
        var foreign = new Wedding { WeddingId = 301, CoupleName = "foreign", TemplateId = 1, CreatedByUserId = otherHost.UserId };
        _db.Context.Weddings.AddRange(owned, foreign);
        _db.Context.SaveChanges();

        Assert.True(await _sut.CanAccessWeddingAsync("host@x.com", 300));
        Assert.False(await _sut.CanAccessWeddingAsync("host@x.com", 301));
    }

    [Theory]
    [InlineData("")]
    [InlineData("ghost@nobody.com")]
    public async Task UnknownOrEmptyEmail_IsDenied(string email)
    {
        SeedCoupleWithWedding("couple@a.com", 100);
        Assert.False(await _sut.CanAccessWeddingAsync(email, 100));
    }

    public void Dispose() => _db.Dispose();
}
