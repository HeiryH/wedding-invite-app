using Microsoft.EntityFrameworkCore;
using WeddingInvite.Models;

namespace WeddingInvite.Data.Repositories
{
    public class WeddingRepository : IWeddingRepository
    {
        private readonly AppDbContext _context;

        // Constructor - DI will inject AppDbContext
        public WeddingRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Wedding?> GetByIdAsync(int id)
        {
            return await _context.Weddings
                .Include(w => w.Guests)
                .Include(w => w.Wishes)
                .Include(w => w.Template)
                .Include(w => w.CreatedBy)
                .FirstOrDefaultAsync(w => w.WeddingId == id);
        }

        public async Task<Wedding?> GetByCoupleNameAsync(string coupleName)
        {
            return await _context.Weddings
                .Include(w => w.Guests)
                .Include(w => w.Wishes)
                .Include(w => w.Template)
                .Include(w => w.CreatedBy)
                .FirstOrDefaultAsync(w => w.CoupleName == coupleName);
        }

        public async Task<Wedding?> GetByDomainAsync(string domain)
        {
            return await _context.Weddings
                .Include(w => w.Template)
                .FirstOrDefaultAsync(w => w.Domain == domain);
        }

        public async Task<IEnumerable<Wedding>> GetAllAsync()
        {
            return await _context.Weddings
                .Include(w => w.Guests)
                .Include(w => w.Wishes)
                .Include(w => w.Template)
                .Include(w => w.CreatedBy)
                .OrderByDescending(w => w.WeddingDate)
                .ToListAsync();
        }

        public async Task<Wedding> CreateAsync(Wedding wedding)
        {
            _context.Weddings.Add(wedding);
            await _context.SaveChangesAsync();
            return wedding;
        }

        public async Task<Wedding> UpdateAsync(Wedding wedding)
        {
            _context.Weddings.Update(wedding);
            await _context.SaveChangesAsync();
            return wedding;
        }

        // public async Task<Wedding> UpdateAsync(Wedding wedding)
        // {
        //     // ✅ Temporarily disable foreign keys for this update
        //     await _context.Database.ExecuteSqlRawAsync("PRAGMA foreign_keys = OFF;");

        //     _context.Weddings.Update(wedding);
        //     await _context.SaveChangesAsync();

        //     // ✅ Re-enable foreign keys
        //     await _context.Database.ExecuteSqlRawAsync("PRAGMA foreign_keys = ON;");

        //     return wedding;
        // }

        public async Task<bool> DeleteAsync(int id)
        {
            var wedding = await _context.Weddings.FindAsync(id);
            if (wedding == null) return false;

            _context.Weddings.Remove(wedding);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> CoupleNameExistsAsync(string coupleName)
        {
            return await _context.Weddings
                .AnyAsync(w => w.CoupleName == coupleName);
        }

        public async Task<IEnumerable<Wedding>> GetByCreatorIdAsync(int userId)
        {
            return await _context.Weddings
                .Include(w => w.Guests)
                .Include(w => w.Wishes)
                .Include(w => w.Template)
                .Where(w => w.CreatedByUserId == userId)
                .OrderByDescending(w => w.WeddingDate)
                .ToListAsync();
        }

        public async Task<IEnumerable<Wedding>> GetStalePrivateAsync(DateTime olderThan)
        {
            return await _context.Weddings
                .Where(w => !w.IsPublic && w.CreatedDate < olderThan)
                .ToListAsync();
        }

        public async Task HardDeleteAsync(int id)
        {
            var wedding = await _context.Weddings.FindAsync(id);
            if (wedding != null)
            {
                _context.Weddings.Remove(wedding);
                await _context.SaveChangesAsync();
            }
        }
    }
}