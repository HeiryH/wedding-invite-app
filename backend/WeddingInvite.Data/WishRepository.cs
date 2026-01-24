using Microsoft.EntityFrameworkCore;
using WeddingInvite.Models;

namespace WeddingInvite.Data.Repositories
{
    public class  WishRepository : IWishRepository
    {
        private readonly AppDbContext _context;
        
        public WishRepository(AppDbContext context)
        {
            _context = context;
        }
        
        public async Task<Wish?> GetByIdAsync(int id)
        {
            return await _context.Wishes
                .Include(w => w.Wedding)
                .FirstOrDefaultAsync(w => w.WishId == id);
        }
        
        public async Task<IEnumerable<Wish>> GetByWeddingIdAsync(int weddingId)
        {
            return await _context.Wishes
                .Where(w => w.WeddingId == weddingId)
                .OrderByDescending(w => w.CreatedDate)
                .ToListAsync();
        }
        
        public async Task<Wish> CreateAsync(Wish wish)
        {
            _context.Wishes.Add(wish);
            await _context.SaveChangesAsync();
            return wish;
        }
        
        public async Task<bool> DeleteAsync(int id)
        {
            var wish = await _context.Wishes.FindAsync(id);
            if (wish == null) return false;
            
            _context.Wishes.Remove(wish);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}