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
            // Include related data (Guests and Wishes)
            return await _context.Weddings
                .Include(w => w.Guests)
                .Include(w => w.Wishes)
                .FirstOrDefaultAsync(w => w.WeddingId == id);
        }
        
        public async Task<Wedding?> GetByCoupleNameAsync(string coupleName)
        {
            return await _context.Weddings
                .Include(w => w.Guests)
                .Include(w => w.Wishes)
                .FirstOrDefaultAsync(w => w.CoupleName == coupleName);
        }
        
        public async Task<IEnumerable<Wedding>> GetAllAsync()
        {
            return await _context.Weddings
                .Include(w => w.Guests)
                .Include(w => w.Wishes)
                .Where(w => w.IsActive)
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
    }
}