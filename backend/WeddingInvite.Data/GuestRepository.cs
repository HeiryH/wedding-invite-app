using Microsoft.EntityFrameworkCore;
using WeddingInvite.Models;

namespace WeddingInvite.Data.Repositories
{
    public class GuestRepository : IGuestRepository
    {
        private readonly AppDbContext _context;
        
        public GuestRepository(AppDbContext context)
        {
            _context = context;
        }
        
        public async Task<Guest?> GetByIdAsync(int id)
        {
            return await _context.Guests
                .Include(g => g.Wedding)
                .FirstOrDefaultAsync(g => g.GuestId == id);
        }
        
        public async Task<IEnumerable<Guest>> GetByWeddingIdAsync(int weddingId)
        {
            return await _context.Guests
                .Where(g => g.WeddingId == weddingId)
                .OrderBy(g => g.GuestName)
                .ToListAsync();
        }
        
        public async Task<Guest> CreateAsync(Guest guest)
        {
            guest.RespondedDate = DateTime.UtcNow;
            _context.Guests.Add(guest);
            await _context.SaveChangesAsync();
            return guest;
        }
        
        public async Task<Guest> UpdateAsync(Guest guest)
        {
            _context.Guests.Update(guest);
            await _context.SaveChangesAsync();
            return guest;
        }
        
        public async Task<bool> DeleteAsync(int id)
        {
            var guest = await _context.Guests.FindAsync(id);
            if (guest == null) return false;
            
            _context.Guests.Remove(guest);
            await _context.SaveChangesAsync();
            return true;
        }
        
        public async Task<int> GetAttendingCountByWeddingIdAsync(int weddingId)
        {
            return await _context.Guests
                .Where(g => g.WeddingId == weddingId && g.IsAttending)
                .SumAsync(g => g.NumberOfAttendees);
        }
    }
}