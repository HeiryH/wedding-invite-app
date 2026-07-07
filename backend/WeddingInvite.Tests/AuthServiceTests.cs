using Microsoft.Extensions.Configuration;
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
            new PasswordResetTokenRepository(_db.Context), new FakeEmailService());
    }

    private void SeedUser(string email, string password, bool isActive = true, string tier = "FREE")
    {
        _db.Context.Users.Add(new User
        {
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
            Role = UserRoles.CoupleAdmin,
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

    public void Dispose() => _db.Dispose();
}
