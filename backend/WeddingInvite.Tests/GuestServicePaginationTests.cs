using WeddingInvite.Core.Services;
using WeddingInvite.Data.Repositories;
using WeddingInvite.Models;
using Xunit;

namespace WeddingInvite.Tests;

public class GuestServicePaginationTests : IDisposable
{
    private readonly TestDb _db = new();
    private readonly GuestService _sut;
    private readonly int _eventId;

    public GuestServicePaginationTests()
    {
        _sut = new GuestService(new GuestRepository(_db.Context), new EventRepository(_db.Context));

        var evt = new Event { Slug = "paged", TemplateId = 1, EventDate = DateTime.UtcNow.AddMonths(2) };
        _db.Context.Events.Add(evt);
        _db.Context.SaveChanges();
        _eventId = evt.EventId;

        // 5 guests, names A..E so ordering (by GuestName) is deterministic
        foreach (var name in new[] { "Alice", "Bob", "Carol", "Dave", "Eve" })
            _db.Context.Guests.Add(new Guest
            {
                EventId = _eventId, GuestName = name, Email = "", PhoneNumber = "",
                GuestSide = "PRIMARY", NumberOfAttendees = 1, SongRequest = "", IsAttending = true,
            });
        _db.Context.SaveChanges();
    }

    [Fact]
    public async Task NoPaginationArgs_ReturnsAll()
    {
        var all = (await _sut.GetByEventIdAsync(_eventId)).ToList();
        Assert.Equal(5, all.Count);
    }

    [Fact]
    public async Task FirstPage_ReturnsFirstSliceInOrder()
    {
        var page1 = (await _sut.GetByEventIdAsync(_eventId, page: 1, pageSize: 2)).ToList();
        Assert.Equal(2, page1.Count);
        Assert.Equal(new[] { "Alice", "Bob" }, page1.Select(g => g.GuestName));
    }

    [Fact]
    public async Task SecondPage_SkipsFirstPage()
    {
        var page2 = (await _sut.GetByEventIdAsync(_eventId, page: 2, pageSize: 2)).ToList();
        Assert.Equal(new[] { "Carol", "Dave" }, page2.Select(g => g.GuestName));
    }

    [Fact]
    public async Task LastPage_ReturnsRemainder()
    {
        var page3 = (await _sut.GetByEventIdAsync(_eventId, page: 3, pageSize: 2)).ToList();
        Assert.Equal(new[] { "Eve" }, page3.Select(g => g.GuestName));
    }

    [Fact]
    public async Task GetCount_ReturnsUnpagedTotal()
    {
        Assert.Equal(5, await _sut.GetCountAsync(_eventId));
    }

    public void Dispose() => _db.Dispose();
}
