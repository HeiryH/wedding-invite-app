using Microsoft.Extensions.Logging.Abstractions;
using WeddingInvite.Core.Services;
using WeddingInvite.Data.Repositories;
using WeddingInvite.Models;
using Xunit;

namespace WeddingInvite.Tests;

/// <summary>
/// Tenant-isolation is the security-critical invariant: an organizer/host admin must never
/// reach an event that isn't theirs. These tests pin that behaviour.
/// </summary>
public class EventAuthorizationServiceTests : IDisposable
{
    private readonly TestDb _db = new();
    private readonly EventAuthorizationService _sut;

    public EventAuthorizationServiceTests()
    {
        _sut = new EventAuthorizationService(
            new UserRepository(_db.Context),
            new EventRepository(_db.Context),
            NullLogger<EventAuthorizationService>.Instance);
    }

    private (User user, Event evt) SeedOrganizerWithEvent(string email, int eventId)
    {
        var evt = new Event { EventId = eventId, Slug = $"w{eventId}", TemplateId = 1 };
        var user = new User { Email = email, PasswordHash = "x", Role = UserRoles.OrganizerAdmin, EventId = eventId };
        _db.Context.Events.Add(evt);
        _db.Context.Users.Add(user);
        _db.Context.SaveChanges();
        return (user, evt);
    }

    [Fact]
    public async Task OrganizerAdmin_CanAccess_OwnEvent()
    {
        SeedOrganizerWithEvent("organizer@a.com", 100);
        Assert.True(await _sut.CanAccessEventAsync("organizer@a.com", 100));
    }

    [Fact]
    public async Task OrganizerAdmin_CannotAccess_OtherEvent()
    {
        SeedOrganizerWithEvent("organizer@a.com", 100);
        SeedOrganizerWithEvent("organizer@b.com", 200);
        // organizer A must not reach event B — cross-tenant denial
        Assert.False(await _sut.CanAccessEventAsync("organizer@a.com", 200));
    }

    [Fact]
    public async Task SuperAdmin_CanAccess_AnyWedding()
    {
        SeedOrganizerWithEvent("organizer@a.com", 100);
        _db.Context.Users.Add(new User { Email = "super@x.com", PasswordHash = "x", Role = UserRoles.SuperAdmin });
        _db.Context.SaveChanges();
        Assert.True(await _sut.CanAccessEventAsync("super@x.com", 100));
    }

    [Fact]
    public async Task HostAdmin_CanAccess_OwnedWedding_ButNotOthers()
    {
        var host = new User { Email = "host@x.com", PasswordHash = "x", Role = UserRoles.HostAdmin };
        var otherHost = new User { Email = "other-host@x.com", PasswordHash = "x", Role = UserRoles.HostAdmin };
        _db.Context.Users.AddRange(host, otherHost);
        _db.Context.SaveChanges();

        var owned = new Event { EventId = 300, Slug = "owned", TemplateId = 1, CreatedByUserId = host.UserId };
        var foreign = new Event { EventId = 301, Slug = "foreign", TemplateId = 1, CreatedByUserId = otherHost.UserId };
        _db.Context.Events.AddRange(owned, foreign);
        _db.Context.SaveChanges();

        Assert.True(await _sut.CanAccessEventAsync("host@x.com", 300));
        Assert.False(await _sut.CanAccessEventAsync("host@x.com", 301));
    }

    [Theory]
    [InlineData("")]
    [InlineData("ghost@nobody.com")]
    public async Task UnknownOrEmptyEmail_IsDenied(string email)
    {
        SeedOrganizerWithEvent("organizer@a.com", 100);
        Assert.False(await _sut.CanAccessEventAsync(email, 100));
    }

    public void Dispose() => _db.Dispose();
}
