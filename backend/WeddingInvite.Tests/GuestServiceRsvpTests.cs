using WeddingInvite.Core.DTOs;
using WeddingInvite.Core.Services;
using WeddingInvite.Data.Repositories;
using WeddingInvite.Models;
using Xunit;

namespace WeddingInvite.Tests;

/// <summary>
/// RSVP capacity rules are the app's trickiest business logic: MaxPax (per-entry cap)
/// vs MaxCapacity (running total), plus the public/open gates. These lock the edges.
/// </summary>
public class GuestServiceRsvpTests : IDisposable
{
    private readonly TestDb _db = new();
    private readonly GuestService _sut;

    public GuestServiceRsvpTests()
    {
        _sut = new GuestService(new GuestRepository(_db.Context), new WeddingRepository(_db.Context));
    }

    private int SeedWedding(int maxPax = 0, int maxCapacity = 0, bool isRsvpOpen = true, bool isPublic = true, int monthsAhead = 3)
    {
        var wedding = new Wedding
        {
            CoupleName = "test-" + Guid.NewGuid().ToString("N")[..6],
            TemplateId = 1,
            WeddingDate = DateTime.UtcNow.AddMonths(monthsAhead),
            MaxPax = maxPax,
            MaxCapacity = maxCapacity,
            IsRsvpOpen = isRsvpOpen,
            IsPublic = isPublic,
        };
        _db.Context.Weddings.Add(wedding);
        _db.Context.SaveChanges();
        return wedding.WeddingId;
    }

    private static CreateGuestDto Rsvp(int attendees, bool attending = true) => new()
    {
        GuestName = "Guest",
        BrideOrGroomSide = "Bride",
        NumberOfAttendees = attendees,
        IsAttending = attending,
    };

    [Fact]
    public async Task Create_WithinLimits_Persists()
    {
        var id = SeedWedding(maxPax: 5, maxCapacity: 100);
        var result = await _sut.CreateAsync(id, Rsvp(3));
        Assert.Equal(3, result.NumberOfAttendees);
        Assert.Equal(3, await new GuestRepository(_db.Fresh()).GetAttendingCountByWeddingIdAsync(id));
    }

    [Fact]
    public async Task Create_ExceedingMaxPax_Throws()
    {
        var id = SeedWedding(maxPax: 2);
        var ex = await Assert.ThrowsAsync<ArgumentException>(() => _sut.CreateAsync(id, Rsvp(3)));
        Assert.Contains("per RSVP", ex.Message);
    }

    [Fact]
    public async Task Create_ExceedingMaxCapacity_Throws()
    {
        var id = SeedWedding(maxCapacity: 5);
        await _sut.CreateAsync(id, Rsvp(3));                 // total now 3
        // second RSVP of 3 would push total to 6 > cap of 5
        var ex = await Assert.ThrowsAsync<ArgumentException>(() => _sut.CreateAsync(id, Rsvp(3)));
        Assert.Contains("capacity", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Create_AtExactCapacity_Succeeds()
    {
        var id = SeedWedding(maxCapacity: 6);
        await _sut.CreateAsync(id, Rsvp(3));
        var result = await _sut.CreateAsync(id, Rsvp(3));    // total exactly 6 == cap
        Assert.Equal(3, result.NumberOfAttendees);
    }

    [Fact]
    public async Task Create_NonAttending_IgnoresCapacity()
    {
        var id = SeedWedding(maxCapacity: 1);
        // "not attending" of 5 must not be blocked by capacity
        var result = await _sut.CreateAsync(id, Rsvp(5, attending: false));
        Assert.False(result.IsAttending);
    }

    [Fact]
    public async Task Create_WhenRsvpClosed_AndEnforced_Throws()
    {
        var id = SeedWedding(isRsvpOpen: false);
        await Assert.ThrowsAsync<ArgumentException>(() => _sut.CreateAsync(id, Rsvp(1), enforceRsvpOpen: true));
    }

    [Fact]
    public async Task Create_WhenRsvpClosed_ButNotEnforced_Succeeds()
    {
        // Admin-side creation (enforceRsvpOpen: false) bypasses the open/public gates.
        var id = SeedWedding(isRsvpOpen: false, isPublic: false);
        var result = await _sut.CreateAsync(id, Rsvp(1), enforceRsvpOpen: false);
        Assert.Equal("Guest", result.GuestName);
    }

    [Fact]
    public async Task Create_OnPrivateWedding_WhenEnforced_Throws()
    {
        var id = SeedWedding(isPublic: false);
        await Assert.ThrowsAsync<InvalidOperationException>(() => _sut.CreateAsync(id, Rsvp(1), enforceRsvpOpen: true));
    }

    [Fact]
    public async Task Create_OnPastWedding_Throws()
    {
        var id = SeedWedding(monthsAhead: -1);
        await Assert.ThrowsAsync<InvalidOperationException>(() => _sut.CreateAsync(id, Rsvp(1)));
    }

    [Fact]
    public async Task Create_OnMissingWedding_Throws()
    {
        await Assert.ThrowsAsync<KeyNotFoundException>(() => _sut.CreateAsync(99999, Rsvp(1)));
    }

    public void Dispose() => _db.Dispose();
}
