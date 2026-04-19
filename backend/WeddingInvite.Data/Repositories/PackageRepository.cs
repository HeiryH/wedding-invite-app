using Microsoft.EntityFrameworkCore;
using WeddingInvite.Models;

namespace WeddingInvite.Data.Repositories
{
    public class PackageRepository : IPackageRepository
    {
        private readonly AppDbContext _context;

        public PackageRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Package?> GetByIdAsync(int id)
        {
            return await _context.Packages
                .Include(p => p.PackageFeatures)
                    .ThenInclude(pf => pf.Feature)
                .FirstOrDefaultAsync(p => p.PackageId == id);
        }

        public async Task<Package?> GetByCodeAsync(string code)
        {
            return await _context.Packages
                .Include(p => p.PackageFeatures)
                    .ThenInclude(pf => pf.Feature)
                .FirstOrDefaultAsync(p => p.PackageCode == code);
        }

        public async Task<IEnumerable<Package>> GetAllAsync()
        {
            return await _context.Packages
                .Include(p => p.PackageFeatures)
                    .ThenInclude(pf => pf.Feature)
                .OrderBy(p => p.SortOrder)
                .ThenBy(p => p.PackageName)
                .ToListAsync();
        }

        public async Task<IEnumerable<Package>> GetActiveAsync()
        {
            return await _context.Packages
                .Include(p => p.PackageFeatures)
                    .ThenInclude(pf => pf.Feature)
                .Where(p => p.IsActive)
                .OrderBy(p => p.SortOrder)
                .ThenBy(p => p.PackageName)
                .ToListAsync();
        }

        public async Task<Package> CreateAsync(Package package)
        {
            _context.Packages.Add(package);
            await _context.SaveChangesAsync();
            return package;
        }

        public async Task<Package> UpdateAsync(Package package)
        {
            _context.Packages.Update(package);
            await _context.SaveChangesAsync();
            return package;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var package = await _context.Packages.FindAsync(id);
            if (package == null) return false;

            _context.Packages.Remove(package);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> NameExistsAsync(string name, int? excludeId = null)
        {
            return await _context.Packages
                .AnyAsync(p => p.PackageName == name && (excludeId == null || p.PackageId != excludeId));
        }

        public async Task<bool> CodeExistsAsync(string code, int? excludeId = null)
        {
            return await _context.Packages
                .AnyAsync(p => p.PackageCode == code && (excludeId == null || p.PackageId != excludeId));
        }
    }
}
