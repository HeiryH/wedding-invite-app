using Microsoft.Extensions.Configuration;
using WeddingInvite.Core.Constants;
using WeddingInvite.Core.DTOs;
using WeddingInvite.Core.Services;
using WeddingInvite.Data.Repositories;
using WeddingInvite.Models;
using Xunit;

namespace WeddingInvite.Tests;

public class AuthServiceTests : IDisposable
{
    private readonly TestDb _db = new();
    private readonly AuthService _sut;

    public AuthServiceTests()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["JwtSettings:SecretKey"] = "test-only-signing-key-at-least-32-bytes-long-xyz",
                ["JwtSettings:Issuer"] = "Test",
                ["JwtSettings:Audience"] = "Test",
                ["JwtSettings:ExpiryMinutes"] = "60",
            })
            .Build();

        _sut = new AuthService(
            new UserRepository(_db.Context), config,
            new PasswordResetTokenRepository(_db.Context), new FakeEmailService(),
            new EventRepository(_db.Context),
            new PackageRepository(_db.Context), new EventFeatureRepository(_db.Context));
    }

    private void SeedUser(string email, string password, bool isActive = true, string tier = "BASIC")
    {
        _db.Context.Users.Add(new User
        {
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
            Role = UserRoles.OrganizerAdmin,
            IsActive = isActive,
            Tier = tier,
        });
        _db.Context.SaveChanges();
    }

    [Fact]
    public async Task Login_WithValidCredentials_ReturnsTokenAndTier()
    {
        SeedUser("user@x.com", "Secret123!", tier: "PREMIUM");

        var result = await _sut.LoginAsync(new LoginDto { Email = "user@x.com", Password = "Secret123!" });

        Assert.False(string.IsNullOrWhiteSpace(result.Token));
        Assert.Equal("user@x.com", result.Email);
        Assert.Equal("PREMIUM", result.Tier);
    }

    [Fact]
    public async Task Login_WithWrongPassword_Throws()
    {
        SeedUser("user@x.com", "Secret123!");
        await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _sut.LoginAsync(new LoginDto { Email = "user@x.com", Password = "wrong" }));
    }

    [Fact]
    public async Task Login_WithUnknownEmail_Throws()
    {
        await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _sut.LoginAsync(new LoginDto { Email = "nobody@x.com", Password = "whatever" }));
    }

    [Fact]
    public async Task Login_WithDisabledAccount_Throws()
    {
        SeedUser("disabled@x.com", "Secret123!", isActive: false);
        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _sut.LoginAsync(new LoginDto { Email = "disabled@x.com", Password = "Secret123!" }));
        Assert.Contains("disabled", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task SetTierAsync_UpgradeToPro_EnablesEventsPackageFeatures()
    {
        // A BASIC-tier organizer whose event has never had any EventFeature rows toggled at all —
        // the state every new wedding starts in (see EventService.CreateAsync's own seeding, and
        // the bug this covers: upgrading tier used to leave every feature off regardless).
        var evt = new Event
        {
            Slug = "tier-sync-test", EventType = EventTypes.Wedding,
            Name1 = "A", Name2 = "B", EventDate = DateTime.UtcNow.AddMonths(1),
            Venue = "Hall", VenueAddress = "Somewhere", TemplateId = 1,
        };
        _db.Context.Events.Add(evt);
        _db.Context.SaveChanges();

        _db.Context.Users.Add(new User
        {
            Email = "organizer@x.com", PasswordHash = BCrypt.Net.BCrypt.HashPassword("Secret123!"),
            Role = UserRoles.OrganizerAdmin, IsActive = true, Tier = "BASIC", EventId = evt.EventId,
        });
        _db.Context.SaveChanges();
        var userId = _db.Context.Users.Single(u => u.Email == "organizer@x.com").UserId;

        await _sut.SetTierAsync(userId, "PRO");

        var enabled = _db.Fresh().EventFeatures
            .Where(ef => ef.EventId == evt.EventId && ef.IsEnabled)
            .Join(_db.Context.Features, ef => ef.FeatureId, f => f.FeatureId, (ef, f) => f.FeatureCode)
            .ToList();

        // PHOTO_BOOTH and CUSTOM_DOMAIN are PRO-only (not in BASIC) — their presence proves the
        // sync actually ran off the new PRO tier, not just re-affirming BASIC's own defaults.
        Assert.Contains(FeatureCodes.PhotoBooth, enabled);
        Assert.Contains(FeatureCodes.CustomDomain, enabled);
        Assert.Contains(FeatureCodes.Seating, enabled);
    }

    [Fact]
    public async Task SetTierAsync_Downgrade_DisablesFeaturesTheNewTierExcludes()
    {
        // The bug report this covers exactly: BASIC -> PRO turns everything on (as it should) but
        // PRO -> BASIC was leaving PHOTO_BOOTH/CUSTOM_DOMAIN/SEATING switched on forever, since the
        // old sync only ever added rows and never revoked one. RSVP/WISHES are in BASIC's own
        // package too, so they must survive the downgrade rather than being touched at all.
        var evt = new Event
        {
            Slug = "tier-downgrade-test", EventType = EventTypes.Wedding,
            Name1 = "A", Name2 = "B", EventDate = DateTime.UtcNow.AddMonths(1),
            Venue = "Hall", VenueAddress = "Somewhere", TemplateId = 1,
        };
        _db.Context.Events.Add(evt);
        _db.Context.SaveChanges();

        _db.Context.Users.Add(new User
        {
            Email = "downgrade@x.com", PasswordHash = BCrypt.Net.BCrypt.HashPassword("Secret123!"),
            Role = UserRoles.OrganizerAdmin, IsActive = true, Tier = "BASIC", EventId = evt.EventId,
        });
        _db.Context.SaveChanges();
        var userId = _db.Context.Users.Single(u => u.Email == "downgrade@x.com").UserId;

        await _sut.SetTierAsync(userId, "PRO");
        await _sut.SetTierAsync(userId, "BASIC");

        var enabled = _db.Fresh().EventFeatures
            .Where(ef => ef.EventId == evt.EventId && ef.IsEnabled)
            .Join(_db.Context.Features, ef => ef.FeatureId, f => f.FeatureId, (ef, f) => f.FeatureCode)
            .ToList();

        Assert.DoesNotContain(FeatureCodes.PhotoBooth, enabled);
        Assert.DoesNotContain(FeatureCodes.CustomDomain, enabled);
        Assert.DoesNotContain(FeatureCodes.Seating, enabled);
        Assert.Contains(FeatureCodes.RSVP, enabled);
        Assert.Contains(FeatureCodes.Wishes, enabled);
    }

    [Fact]
    public async Task SetTierAsync_NeverDisablesAFeatureStillWithinTheNewTier()
    {
        // A deliberate manual toggle-off must survive a later tier change AS LONG AS the feature
        // is still within that tier's entitlement — the sync only revokes what the new tier
        // actually excludes, it never flips something the admin turned off back on, and it never
        // touches something still allowed just because tier was re-saved.
        var evt = new Event
        {
            Slug = "tier-sync-no-regress", EventType = EventTypes.Wedding,
            Name1 = "A", Name2 = "B", EventDate = DateTime.UtcNow.AddMonths(1),
            Venue = "Hall", VenueAddress = "Somewhere", TemplateId = 1,
        };
        _db.Context.Events.Add(evt);
        _db.Context.SaveChanges();

        _db.Context.Users.Add(new User
        {
            Email = "organizer2@x.com", PasswordHash = BCrypt.Net.BCrypt.HashPassword("Secret123!"),
            Role = UserRoles.OrganizerAdmin, IsActive = true, Tier = "PRO", EventId = evt.EventId,
        });
        _db.Context.SaveChanges();
        var userId = _db.Context.Users.Single(u => u.Email == "organizer2@x.com").UserId;

        // First sync (e.g. from creation) turns everything on; simulate the couple then
        // deliberately switching photo booth back off before any further tier change.
        await _sut.SetTierAsync(userId, "PRO");
        var photoBoothFeatureId = _db.Context.Features.Single(f => f.FeatureCode == FeatureCodes.PhotoBooth).FeatureId;
        var eventFeatureRepo = new EventFeatureRepository(_db.Context);
        await eventFeatureRepo.DisableFeatureAsync(evt.EventId, photoBoothFeatureId);

        // Re-running SetTierAsync at the same tier (e.g. an admin re-saving) must not silently
        // resurrect the disabled feature.
        await _sut.SetTierAsync(userId, "PRO");

        var stillDisabled = _db.Fresh().EventFeatures
            .Single(ef => ef.EventId == evt.EventId && ef.FeatureId == photoBoothFeatureId);
        Assert.False(stillDisabled.IsEnabled);
    }

    public void Dispose() => _db.Dispose();
}
