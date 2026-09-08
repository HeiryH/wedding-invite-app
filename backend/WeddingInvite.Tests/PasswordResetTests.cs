using Microsoft.Extensions.Configuration;
using WeddingInvite.Core.Services;
using WeddingInvite.Data.Repositories;
using WeddingInvite.Models;
using Xunit;

namespace WeddingInvite.Tests;

public class PasswordResetTests : IDisposable
{
    private readonly TestDb _db = new();
    private readonly AuthService _sut;
    private readonly FakeEmailService _email = new();
    private readonly PasswordResetTokenRepository _tokenRepo;

    public PasswordResetTests()
    {
        var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["JwtSettings:SecretKey"] = "test-only-signing-key-at-least-32-bytes-long-xyz",
            ["JwtSettings:Issuer"] = "Test",
            ["JwtSettings:Audience"] = "Test",
            ["JwtSettings:ExpiryMinutes"] = "60",
        }).Build();

        _tokenRepo = new PasswordResetTokenRepository(_db.Context);
        _sut = new AuthService(new UserRepository(_db.Context), config, _tokenRepo, _email,
            new EventRepository(_db.Context),
            new PackageRepository(_db.Context), new EventFeatureRepository(_db.Context));
    }

    private User SeedUser(string email = "user@x.com", string password = "OldPass1", bool active = true)
    {
        var u = new User
        {
            Email = email, PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
            Role = UserRoles.OrganizerAdmin, IsActive = active,
        };
        _db.Context.Users.Add(u);
        _db.Context.SaveChanges();
        return u;
    }

    // Pulls the raw token out of the emailed reset link.
    private static string ExtractToken(string html)
    {
        var m = System.Text.RegularExpressions.Regex.Match(html, @"token=([^""&]+)");
        return Uri.UnescapeDataString(m.Groups[1].Value);
    }

    [Fact]
    public async Task Request_ForKnownUser_CreatesTokenAndSendsEmail()
    {
        SeedUser();
        await _sut.RequestPasswordResetAsync("user@x.com", "https://app/reset-password");

        Assert.Single(_email.Sends);
        Assert.Equal("user@x.com", _email.Sends[0].To);
        Assert.Contains("token=", _email.Sends[0].HtmlBody);
    }

    [Fact]
    public async Task Request_ForUnknownEmail_DoesNothing_NoEnumeration()
    {
        await _sut.RequestPasswordResetAsync("ghost@nobody.com", "https://app/reset-password");
        Assert.Empty(_email.Sends);
    }

    [Fact]
    public async Task Reset_WithValidToken_ChangesPassword()
    {
        SeedUser(password: "OldPass1");
        await _sut.RequestPasswordResetAsync("user@x.com", "https://app/reset-password");
        var token = ExtractToken(_email.Sends[0].HtmlBody);

        await _sut.ResetPasswordWithTokenAsync(token, "BrandNew9");

        // Old password no longer works, new one does.
        await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _sut.LoginAsync(new WeddingInvite.Core.DTOs.LoginDto { Email = "user@x.com", Password = "OldPass1" }));
        var ok = await _sut.LoginAsync(new WeddingInvite.Core.DTOs.LoginDto { Email = "user@x.com", Password = "BrandNew9" });
        Assert.Equal("user@x.com", ok.Email);
    }

    [Fact]
    public async Task Reset_WithSameTokenTwice_FailsSecondTime()
    {
        SeedUser();
        await _sut.RequestPasswordResetAsync("user@x.com", "https://app/reset-password");
        var token = ExtractToken(_email.Sends[0].HtmlBody);

        await _sut.ResetPasswordWithTokenAsync(token, "BrandNew9");
        await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _sut.ResetPasswordWithTokenAsync(token, "AnotherOne1"));
    }

    [Fact]
    public async Task Reset_WithBogusToken_Throws()
    {
        await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _sut.ResetPasswordWithTokenAsync("not-a-real-token", "BrandNew9"));
    }

    [Fact]
    public async Task Reset_WithExpiredToken_Throws()
    {
        var user = SeedUser();
        // Insert an already-expired token directly.
        var raw = "expired-raw-token";
        var hash = Convert.ToHexString(System.Security.Cryptography.SHA256.HashData(
            System.Text.Encoding.UTF8.GetBytes(raw)));
        _db.Context.PasswordResetTokens.Add(new PasswordResetToken
        {
            UserId = user.UserId, TokenHash = hash, ExpiresAt = DateTime.UtcNow.AddMinutes(-5),
        });
        _db.Context.SaveChanges();

        await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _sut.ResetPasswordWithTokenAsync(raw, "BrandNew9"));
    }

    [Fact]
    public async Task Reset_WithTooShortPassword_Throws()
    {
        SeedUser();
        await _sut.RequestPasswordResetAsync("user@x.com", "https://app/reset-password");
        var token = ExtractToken(_email.Sends[0].HtmlBody);
        await Assert.ThrowsAsync<ArgumentException>(() => _sut.ResetPasswordWithTokenAsync(token, "123"));
    }

    public void Dispose() => _db.Dispose();
}
