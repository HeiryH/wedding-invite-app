using WeddingInvite.Core.DTOs;
using WeddingInvite.Core.Services;
using WeddingInvite.Data.Repositories;
using WeddingInvite.Models;
using Xunit;

namespace WeddingInvite.Tests;

/// <summary>
/// Pins down EventService's create/update validation and slug behaviour after the Wedding→Event
/// generalization rename (see ~/.claude/plans/so-this-invite-app-warm-pebble.md). Slug/Name1/
/// Name2/EventType/EventTitle replace CoupleName/BrideName/GroomName.
///
/// The slug is set once at creation and frozen from then on — UpdateAsync never touches it, no
/// matter what the names change to, so a shared invitation link never dies from an unrelated edit.
/// The only way it moves afterward is the explicit, SUPER_ADMIN-only SetSlugAsync.
/// </summary>
public class EventServiceSlugTests
{
    private static EventService BuildService(TestDb db) => new(
        new EventRepository(db.Context),
        new GuestRepository(db.Context),
        new PackageRepository(db.Context),
        new EventFeatureRepository(db.Context),
        new TemplateRepository(db.Context),
        new UserRepository(db.Context));

    private static CreateEventDto ValidCreateDto(string slug = "ali-and-siti", string bride = "Siti Aminah", string groom = "Ali Bin Abu") => new()
    {
        Slug = slug,
        EventType = EventTypes.Wedding,
        Name1 = bride,
        Name2 = groom,
        EventDate = DateTime.UtcNow.AddMonths(3),
        Venue = "Grand Hall",
        VenueAddress = "1 Main St",
        TemplateId = 1,
    };

    // ── CreateAsync validation ──────────────────────────────────────────────

    [Fact]
    public async Task CreateAsync_Throws_WhenBrideNameMissing()
    {
        using var db = new TestDb();
        var dto = ValidCreateDto(bride: "  ");

        await Assert.ThrowsAsync<ArgumentException>(() => BuildService(db).CreateAsync(dto));
    }

    [Fact]
    public async Task CreateAsync_Throws_WhenGroomNameMissing()
    {
        using var db = new TestDb();
        var dto = ValidCreateDto(groom: "");

        await Assert.ThrowsAsync<ArgumentException>(() => BuildService(db).CreateAsync(dto));
    }

    [Theory]
    [InlineData("ali and siti")] // spaces not allowed
    [InlineData("ali_siti")]     // underscore not allowed
    [InlineData("ali/siti")]     // slash not allowed
    public async Task CreateAsync_Throws_WhenSlugHasInvalidCharacters(string invalidSlug)
    {
        using var db = new TestDb();
        var dto = ValidCreateDto(slug: invalidSlug);

        await Assert.ThrowsAsync<ArgumentException>(() => BuildService(db).CreateAsync(dto));
    }

    [Fact]
    public async Task CreateAsync_Throws_WhenSlugAlreadyTaken()
    {
        using var db = new TestDb();
        var svc = BuildService(db);
        await svc.CreateAsync(ValidCreateDto());

        await Assert.ThrowsAsync<ArgumentException>(() => svc.CreateAsync(ValidCreateDto()));
    }

    [Fact]
    public async Task CreateAsync_Throws_WhenWeddingDateIsInThePast()
    {
        using var db = new TestDb();
        var dto = ValidCreateDto();
        dto.EventDate = DateTime.UtcNow.AddDays(-1);

        await Assert.ThrowsAsync<ArgumentException>(() => BuildService(db).CreateAsync(dto));
    }

    [Fact]
    public async Task CreateAsync_LowercasesAndTrims_SlugName1AndName2()
    {
        using var db = new TestDb();
        var dto = ValidCreateDto(slug: "Ali-And-Siti", bride: "  Siti Aminah  ", groom: "  Ali Bin Abu  ");

        var created = await BuildService(db).CreateAsync(dto);

        Assert.Equal("ali-and-siti", created.Slug);
        Assert.Equal("Siti Aminah", created.Name1);
        Assert.Equal("Ali Bin Abu", created.Name2);
    }

    // ── PARTY / CEREMONY naming requirements ─────────────────────────────────

    [Fact]
    public async Task CreateAsync_Throws_WhenPartyHasOnlyEventTitle_NoName1()
    {
        using var db = new TestDb();
        var dto = new CreateEventDto
        {
            Slug = "birthday-bash",
            EventType = EventTypes.Party,
            EventTitle = "30th Birthday Bash",
            EventDate = DateTime.UtcNow.AddMonths(1),
            Venue = "Hall",
            VenueAddress = "Somewhere",
            TemplateId = 0, // no template gate to worry about here
        };

        await Assert.ThrowsAsync<ArgumentException>(() => BuildService(db).CreateAsync(dto));
    }

    [Fact]
    public async Task CreateAsync_Succeeds_WhenPartyHasOnlyName1()
    {
        using var db = new TestDb();

        // TemplateId is a required FK, so even "no template gate" needs a real row — seed one
        // that actually supports PARTY (the seeded templates are all WEDDING-only).
        var partyTemplate = new Template
        {
            TemplateName = "Party Template",
            TemplateCode = "party-template",
            ComponentPath = "TemplateParty",
            EventTypes = EventTypes.Party,
        };
        db.Context.Templates.Add(partyTemplate);
        db.Context.SaveChanges();

        var dto = new CreateEventDto
        {
            Slug = "aisyahs-party",
            EventType = EventTypes.Party,
            Name1 = "Aisyah",
            EventDate = DateTime.UtcNow.AddMonths(1),
            Venue = "Hall",
            VenueAddress = "Somewhere",
            TemplateId = partyTemplate.TemplateId,
        };

        var created = await BuildService(db).CreateAsync(dto);
        Assert.Equal("aisyahs-party", created.Slug);
        Assert.Equal("Aisyah", created.Name1);
    }

    // ── Template EventType gate ───────────────────────────────────────────────

    [Fact]
    public async Task CreateAsync_Throws_WhenTemplateDoesNotSupportEventType()
    {
        using var db = new TestDb();
        // Template 1 ("Classic Rose") is seeded with EventTypes = "WEDDING" only.
        var dto = new CreateEventDto
        {
            Slug = "aisyahs-party-2",
            EventType = EventTypes.Party,
            Name1 = "Aisyah",
            EventDate = DateTime.UtcNow.AddMonths(1),
            Venue = "Hall",
            VenueAddress = "Somewhere",
            TemplateId = 1,
        };

        await Assert.ThrowsAsync<ArgumentException>(() => BuildService(db).CreateAsync(dto));
    }

    // ── UpdateAsync leaves the slug alone ────────────────────────────────────
    // UpdateAsync used to regenerate the slug from the names on every save — editing a name
    // silently moved the public URL and broke every link already shared. It now never touches
    // Slug; the only way the slug changes after creation is the explicit SetSlugAsync below.

    [Fact]
    public async Task UpdateAsync_LeavesSlugUnchanged_WhenNamesChange()
    {
        using var db = new TestDb();
        var svc = BuildService(db);
        var created = await svc.CreateAsync(ValidCreateDto());

        var updated = await svc.UpdateAsync(created.EventId, new UpdateEventDto
        {
            Name1 = "Nur Hidayah",
            Name2 = "Firdaus Bin Zainal",
            EventDate = created.EventDate,
            Venue = created.Venue,
            VenueAddress = created.VenueAddress,
        });

        Assert.Equal(created.Slug, updated.Slug);
        Assert.Equal("Nur Hidayah", updated.Name1);
        Assert.Equal("Firdaus Bin Zainal", updated.Name2);
    }

    // ── SetSlugAsync ──────────────────────────────────────────────────────────

    [Fact]
    public async Task SetSlugAsync_ChangesSlug_WhenValidAndAvailable()
    {
        using var db = new TestDb();
        var svc = BuildService(db);
        var created = await svc.CreateAsync(ValidCreateDto());

        var updated = await svc.SetSlugAsync(created.EventId, "Nur-And-Firdaus");

        Assert.Equal("nur-and-firdaus", updated.Slug);
    }

    [Fact]
    public async Task SetSlugAsync_Throws_WhenSlugHasInvalidCharacters()
    {
        using var db = new TestDb();
        var svc = BuildService(db);
        var created = await svc.CreateAsync(ValidCreateDto());

        await Assert.ThrowsAsync<InvalidOperationException>(() => svc.SetSlugAsync(created.EventId, "nur and firdaus"));
    }

    [Fact]
    public async Task SetSlugAsync_Throws_WhenSlugAlreadyTakenByAnotherEvent()
    {
        using var db = new TestDb();
        var svc = BuildService(db);
        await svc.CreateAsync(ValidCreateDto(slug: "nur-firdaus", bride: "Nur", groom: "Firdaus"));
        var second = await svc.CreateAsync(ValidCreateDto(slug: "someone-else", bride: "Someone", groom: "Else"));

        await Assert.ThrowsAsync<InvalidOperationException>(() => svc.SetSlugAsync(second.EventId, "nur-firdaus"));
    }

    [Fact]
    public async Task SetSlugAsync_Succeeds_WhenSlugUnchanged()
    {
        // A no-op rename must not trip the collision check against the event's own current slug.
        using var db = new TestDb();
        var svc = BuildService(db);
        var created = await svc.CreateAsync(ValidCreateDto());

        var updated = await svc.SetSlugAsync(created.EventId, created.Slug);

        Assert.Equal(created.Slug, updated.Slug);
    }
}
