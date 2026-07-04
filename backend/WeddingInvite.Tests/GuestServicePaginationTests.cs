using WeddingInvite.Core.Services;
using WeddingInvite.Data.Repositories;
using WeddingInvite.Models;
using Xunit;

namespace WeddingInvite.Tests;

public class GuestServicePaginationTests : IDisposable
{
    private readonly TestDb _db = new();
    private readonly GuestService _sut;
    private readonly int _weddingId;

    public GuestServicePaginationTests()
    {
        _sut = new GuestService(new GuestRepository(_db.Context), new WeddingRepository(_db.Context));

        var wedding = new Wedding { CoupleName = "paged", TemplateId = 1, WeddingDate = DateTime.UtcNow.AddMonths(2) };
        _db.Context.Weddings.Add(wedding);
        _db.Context.SaveChanges();
        _weddingId = wedding.WeddingId;

        // 5 guests, names A..E so ordering (by GuestName) is deterministic
        foreach (var name in new[] { "Alice", "Bob", "Carol", "Dave", "Eve" })
            _db.Context.Guests.Add(new Guest
            {
                WeddingId = _weddingId, GuestName = name, Email = "", PhoneNumber = "",
                BrideOrGroomSide = "Bride", NumberOfAttendees = 1, SongRequest = "", IsAttending = true,
            });
        _db.Context.SaveChanges();
    }

    [Fact]
    public async Task NoPaginationArgs_ReturnsAll()
    {
        var all = (await _sut.GetByWeddingIdAsync(_weddingId)).ToList();
        Assert.Equal(5, all.Count);
    }

    [Fact]
    public async Task FirstPage_ReturnsFirstSliceInOrder()
    {
        var page1 = (await _sut.GetByWeddingIdAsync(_weddingId, page: 1, pageSize: 2)).ToList();
        Assert.Equal(2, page1.Count);
        Assert.Equal(new[] { "Alice", "Bob" }, page1.Select(g => g.GuestName));
    }

    [Fact]
    public async Task SecondPage_SkipsFirstPage()
    {
        var page2 = (await _sut.GetByWeddingIdAsync(_weddingId, page: 2, pageSize: 2)).ToList();
        Assert.Equal(new[] { "Carol", "Dave" }, page2.Select(g => g.GuestName));
    }

    [Fact]
    public async Task LastPage_ReturnsRemainder()
    {
        var page3 = (await _sut.GetByWeddingIdAsync(_weddingId, page: 3, pageSize: 2)).ToList();
        Assert.Equal(new[] { "Eve" }, page3.Select(g => g.GuestName));
    }

    [Fact]
    public async Task GetCount_ReturnsUnpagedTotal()
    {
        Assert.Equal(5, await _sut.GetCountAsync(_weddingId));
    }

    public void Dispose() => _db.Dispose();
}
