using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using WeddingInvite.Data;
using WeddingInvite.Core.Services;
using WeddingInvite.Data.Repositories;

namespace WeddingInvite.Tests;

/// <summary>
/// Spins up an isolated, in-memory SQLite-backed <see cref="AppDbContext"/> per test.
/// SQLite (rather than the EF InMemory provider) keeps real relational semantics —
/// the same engine the app runs on. The connection is kept open for the DB's lifetime
/// (an in-memory SQLite database vanishes when its last connection closes).
/// </summary>
public sealed class TestDb : IDisposable
{
    private readonly SqliteConnection _connection;

    public AppDbContext Context { get; }

    public TestDb()
    {
        _connection = new SqliteConnection("DataSource=:memory:");
        _connection.Open();

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(_connection)
            .Options;

        Context = new AppDbContext(options);
        Context.Database.EnsureCreated(); // builds schema + applies HasData seeds
    }

    /// <summary>Detaches all tracked entities so a fresh read hits the store, not the cache.</summary>
    public AppDbContext Fresh()
    {
        Context.ChangeTracker.Clear();
        return Context;
    }

    public GuestService CreateGuestService()
    {
        var events = new EventRepository(Context);
        var config = new TemplateConfigService(
            new TemplateConfigRepository(Context), new TemplateConfigDefaultRepository(Context), events);
        return new GuestService(new GuestRepository(Context), events, config);
    }

    public void Dispose()
    {
        Context.Dispose();
        _connection.Dispose();
    }
}
