using WeddingInvite.Core.Services;
using WeddingInvite.Data.Repositories;
using WeddingInvite.Models;
using Xunit;

namespace WeddingInvite.Tests;

/// <summary>
/// WeddingService.DeleteAsync is a real, permanent delete (not the deactivate-and-keep-the-row
/// behaviour it used to have) — it must actually remove the wedding row, cascade its child data, and
/// free the couple name for reuse. ToggleActiveAsync remains the way to deactivate without deleting.
/// </summary>
public class WeddingDeleteTests
{
    private static WeddingService BuildService(TestDb db) => new(
        new WeddingRepository(db.Context),
        new GuestRepository(db.Context),
        new PackageRepository(db.Context),
        new WeddingFeatureRepository(db.Context),
        new TemplateRepository(db.Context),
        new UserRepository(db.Context));

    [Fact]
    public async Task Delete_RemovesTheWeddingRow()
    {
        using var db = new TestDb();
        db.Context.Weddings.Add(new Wedding { WeddingId = 1, CoupleName = "ali-and-siti", BrideName = "Siti", GroomName = "Ali", TemplateId = 1 });
        db.Context.SaveChanges();

        var result = await BuildService(db).DeleteAsync(1);

        Assert.True(result);
        Assert.Null(await db.Fresh().Weddings.FindAsync(1));
    }

    [Fact]
    public async Task Delete_ReturnsFalse_WhenWeddingDoesNotExist()
    {
        using var db = new TestDb();
        Assert.False(await BuildService(db).DeleteAsync(999));
    }

    [Fact]
    public async Task Delete_CascadesChildData()
    {
        using var db = new TestDb();
        var w = new Wedding { WeddingId = 1, CoupleName = "ali-and-siti", BrideName = "Siti", GroomName = "Ali", TemplateId = 1 };
        db.Context.Weddings.Add(w);
        db.Context.Guests.Add(new Guest { WeddingId = 1, GuestName = "Guest 1" });
        db.Context.Wishes.Add(new Wish { WeddingId = 1, GuestName = "Guest 1", Message = "Congrats!" });
        db.Context.TemplateConfigs.Add(new WeddingTemplateConfig { WeddingId = 1, ConfigKey = "invite.body", ConfigValue = "hi" });
        db.Context.SaveChanges();

        await BuildService(db).DeleteAsync(1);

        var fresh = db.Fresh();
        Assert.Empty(fresh.Guests.Where(g => g.WeddingId == 1));
        Assert.Empty(fresh.Wishes.Where(x => x.WeddingId == 1));
        Assert.Empty(fresh.TemplateConfigs.Where(c => c.WeddingId == 1));
    }

    [Fact]
    public async Task Delete_FreesTheCoupleNameForReuse()
    {
        using var db = new TestDb();
        var svc = BuildService(db);
        db.Context.Weddings.Add(new Wedding { WeddingId = 1, CoupleName = "ali-and-siti", BrideName = "Siti", GroomName = "Ali", TemplateId = 1 });
        db.Context.SaveChanges();

        await svc.DeleteAsync(1);

        var recreated = await svc.CreateAsync(new Core.DTOs.CreateWeddingDto
        {
            CoupleName = "ali-and-siti",
            BrideName = "Siti",
            GroomName = "Ali",
            WeddingDate = DateTime.UtcNow.AddMonths(3),
            Venue = "V",
            VenueAddress = "X",
            TemplateId = 1,
        });

        Assert.Equal("ali-and-siti", recreated.CoupleName);
    }

    [Fact]
    public async Task ToggleActive_StillDeactivatesWithoutDeleting()
    {
        using var db = new TestDb();
        var svc = BuildService(db);
        db.Context.Weddings.Add(new Wedding { WeddingId = 1, CoupleName = "ali-and-siti", BrideName = "Siti", GroomName = "Ali", TemplateId = 1, IsActive = true });
        db.Context.SaveChanges();

        var updated = await svc.ToggleActiveAsync(1, false);

        Assert.False(updated.IsActive);
        Assert.NotNull(await db.Fresh().Weddings.FindAsync(1)); // row still exists — this is deactivate, not delete
    }
}
