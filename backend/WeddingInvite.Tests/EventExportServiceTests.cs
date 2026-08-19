using System.IO.Compression;
using System.Text;
using WeddingInvite.Core.Services;
using WeddingInvite.Data.Repositories;
using WeddingInvite.Models;
using Xunit;

namespace WeddingInvite.Tests;

/// <summary>
/// EventExportService bundles every piece of an event's data (RSVPs, wishes, seating, itinerary,
/// full customization config, photos, audio) into one zip. These tests pin: null on a missing
/// event, the expected top-level entries, graceful handling of missing on-disk files (no real
/// filesystem exists in this test process), and correct CSV escaping.
/// </summary>
public class EventExportServiceTests
{
    private const int WeddingId = 1;

    private static EventExportService BuildService(TestDb db) => new(
        new EventRepository(db.Context),
        new UserRepository(db.Context),
        new TemplateService(new TemplateRepository(db.Context)),
        new GuestService(new GuestRepository(db.Context), new EventRepository(db.Context)),
        new WishService(new WishRepository(db.Context), new EventRepository(db.Context)),
        new TableService(new TableRepository(db.Context), new GuestRepository(db.Context), new EventRepository(db.Context)),
        new ItineraryService(new ItineraryRepository(db.Context), new EventRepository(db.Context)),
        new TemplateConfigService(
            new TemplateConfigRepository(db.Context),
            new TemplateConfigDefaultRepository(db.Context),
            new EventRepository(db.Context)),
        new PhotoRepository(db.Context));

    private static TestDb SeedWedding(int templateId = 1)
    {
        var db = new TestDb();
        db.Context.Events.Add(new Event
        {
            EventId = WeddingId,
            Slug = "ali-and-siti",
            Name1 = "Siti",
            Name2 = "Ali",
            EventDate = new DateTime(2027, 12, 1),
            Venue = "Empire",
            TemplateId = templateId,
        });
        db.Context.SaveChanges();
        return db;
    }

    private static Dictionary<string, string> ReadZip(byte[] bytes)
    {
        using var ms = new MemoryStream(bytes);
        using var zip = new ZipArchive(ms, ZipArchiveMode.Read);
        var result = new Dictionary<string, string>();
        foreach (var entry in zip.Entries)
        {
            using var reader = new StreamReader(entry.Open(), Encoding.UTF8);
            result[entry.FullName] = reader.ReadToEnd();
        }
        return result;
    }

    [Fact]
    public async Task BuildExportZipAsync_ReturnsNull_WhenWeddingDoesNotExist()
    {
        using var db = new TestDb();
        var result = await BuildService(db).BuildExportZipAsync(999);
        Assert.Null(result);
    }

    [Fact]
    public async Task BuildExportZipAsync_ProducesExpectedTopLevelEntries()
    {
        using var db = SeedWedding();
        db.Context.Guests.Add(new Guest { EventId = WeddingId, GuestName = "Guest 1", GuestSide = "PRIMARY" });
        db.Context.Wishes.Add(new Wish { EventId = WeddingId, GuestName = "Guest 1", Message = "Congrats!" });
        db.Context.Tables.Add(new Table { EventId = WeddingId, TableName = "Table 1", Capacity = 8 });
        db.Context.ItineraryItems.Add(new ItineraryItem { EventId = WeddingId, Label = "Ceremony", SortOrder = 1 });
        db.Context.TemplateConfigs.Add(new EventTemplateConfig { EventId = WeddingId, ConfigKey = "invite.heading", ConfigValue = "Welcome" });
        db.Context.SaveChanges();

        var bytes = await BuildService(db).BuildExportZipAsync(WeddingId);
        Assert.NotNull(bytes);

        var entries = ReadZip(bytes!);
        Assert.Contains("wedding.json", entries.Keys);
        Assert.Contains("config.json", entries.Keys);
        Assert.Contains("guests.csv", entries.Keys);
        Assert.Contains("wishes.csv", entries.Keys);
        Assert.Contains("itinerary.csv", entries.Keys);
        Assert.Contains("seating.csv", entries.Keys);
        Assert.Contains("photos-manifest.csv", entries.Keys);

        Assert.Contains("ali-and-siti", entries["wedding.json"]);
        Assert.Contains("invite.heading", entries["config.json"]);
        Assert.Contains("Guest 1", entries["guests.csv"]);
        Assert.Contains("Congrats!", entries["wishes.csv"]);
        Assert.Contains("Ceremony", entries["itinerary.csv"]);
        Assert.Contains("Table 1", entries["seating.csv"]);
    }

    [Fact]
    public async Task BuildExportZipAsync_SkipsMissingPhotoFile_ButRecordsItInTheManifest()
    {
        using var db = SeedWedding();
        db.Context.Photos.Add(new Photo
        {
            EventId = WeddingId,
            FileName = "ghost.jpg",
            FilePath = "wwwroot/uploads/999999/Guest/does-not-exist.jpg", // no real filesystem in tests
            UploadedBy = PhotoUploaderRole.Guest,
            ContentType = "image/jpeg",
        });
        db.Context.SaveChanges();

        var bytes = await BuildService(db).BuildExportZipAsync(WeddingId);
        var entries = ReadZip(bytes!);

        Assert.DoesNotContain(entries.Keys, k => k.StartsWith("photos/"));
        Assert.Contains("ghost.jpg", entries["photos-manifest.csv"]);
        Assert.Contains("\"No\"", entries["photos-manifest.csv"]); // FileIncluded = false
    }

    [Fact]
    public async Task BuildExportZipAsync_OmitsAudioFolder_WhenNoMusicUrlConfigured()
    {
        using var db = SeedWedding();
        var bytes = await BuildService(db).BuildExportZipAsync(WeddingId);
        var entries = ReadZip(bytes!);

        Assert.DoesNotContain(entries.Keys, k => k.StartsWith("audio/"));
    }

    [Fact]
    public async Task BuildExportZipAsync_OmitsAudioFolder_WhenMusicFileIsMissingOnDisk()
    {
        using var db = SeedWedding();
        db.Context.TemplateConfigs.Add(new EventTemplateConfig
        {
            EventId = WeddingId,
            ConfigKey = "music.url",
            ConfigValue = "/uploads/999999/audio/does-not-exist.mp3",
        });
        db.Context.SaveChanges();

        var bytes = await BuildService(db).BuildExportZipAsync(WeddingId);
        var entries = ReadZip(bytes!);

        Assert.DoesNotContain(entries.Keys, k => k.StartsWith("audio/"));
    }

    [Fact]
    public async Task BuildExportZipAsync_CsvEscapesCommasAndQuotes()
    {
        using var db = SeedWedding();
        db.Context.Guests.Add(new Guest
        {
            EventId = WeddingId,
            GuestName = "Smith, \"Junior\"",
            GuestSide = "SECONDARY",
        });
        db.Context.SaveChanges();

        var bytes = await BuildService(db).BuildExportZipAsync(WeddingId);
        var entries = ReadZip(bytes!);

        // RFC 4180: an embedded quote is escaped by doubling it, the whole cell stays quoted.
        Assert.Contains("\"Smith, \"\"Junior\"\"\"", entries["guests.csv"]);
    }
}
