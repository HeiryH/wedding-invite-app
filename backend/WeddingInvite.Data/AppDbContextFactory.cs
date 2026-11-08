using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace WeddingInvite.Data;

// EF tooling must not boot the API (and its runtime services) to scaffold or review migrations.
public class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var directory = new DirectoryInfo(Directory.GetCurrentDirectory());
        string? apiDirectory = null;
        while (directory != null)
        {
            var candidate = Path.Combine(directory.FullName, "backend", "WeddingInvite.API");
            if (Directory.Exists(candidate)) { apiDirectory = candidate; break; }
            directory = directory.Parent;
        }
        var connection = Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection")
            ?? $"Data Source={Path.Combine(apiDirectory ?? Directory.GetCurrentDirectory(), "wedding.db")}";
        return new(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(connection).Options);
    }
}
