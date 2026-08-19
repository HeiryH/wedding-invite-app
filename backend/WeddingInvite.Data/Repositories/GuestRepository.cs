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
                .Include(g => g.Event)
                .Include(g => g.Table)
                .FirstOrDefaultAsync(g => g.GuestId == id);
        }

        public async Task<IEnumerable<Guest>> GetByEventIdAsync(int eventId, int? skip = null, int? take = null)
        {
            IQueryable<Guest> query = _context.Guests
                .AsNoTracking() // read-only list for display — skip change-tracking overhead
                .Include(g => g.Table)
                .Where(g => g.EventId == eventId)
                .OrderBy(g => g.GuestName);

            if (skip is int s) query = query.Skip(s);
            if (take is int t) query = query.Take(t);

            return await query.ToListAsync();
        }

        public async Task<int> CountByEventIdAsync(int eventId)
        {
            return await _context.Guests.CountAsync(g => g.EventId == eventId);
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

        public async Task<int> GetAttendingCountByEventIdAsync(int eventId)
        {
            return await _context.Guests
                .Where(g => g.EventId == eventId && g.IsAttending)
                .SumAsync(g => g.NumberOfAttendees);
        }
    }
}
