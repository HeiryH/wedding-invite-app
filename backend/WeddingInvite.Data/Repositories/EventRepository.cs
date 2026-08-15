using Microsoft.EntityFrameworkCore;
using WeddingInvite.Models;

namespace WeddingInvite.Data.Repositories
{
    public class EventRepository : IEventRepository
    {
        private readonly AppDbContext _context;

        // Constructor - DI will inject AppDbContext
        public EventRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Event?> GetByIdAsync(int id)
        {
            return await _context.Events
                .Include(e => e.Guests)
                .Include(e => e.Wishes)
                .Include(e => e.Template)
                .Include(e => e.CreatedBy)
                .FirstOrDefaultAsync(e => e.EventId == id);
        }

        public async Task<Event?> GetBySlugAsync(string slug)
        {
            return await _context.Events
                .Include(e => e.Guests)
                .Include(e => e.Wishes)
                .Include(e => e.Template)
                .Include(e => e.CreatedBy)
                .FirstOrDefaultAsync(e => e.Slug == slug);
        }

        public async Task<Event?> GetByDomainAsync(string domain)
        {
            return await _context.Events
                .Include(e => e.Template)
                .FirstOrDefaultAsync(e => e.Domain == domain);
        }

        public async Task<IEnumerable<Event>> GetAllAsync()
        {
            return await _context.Events
                .Include(e => e.Guests)
                .Include(e => e.Wishes)
                .Include(e => e.Template)
                .Include(e => e.CreatedBy)
                .OrderByDescending(e => e.EventDate)
                .ToListAsync();
        }

        public async Task<Event> CreateAsync(Event evt)
        {
            _context.Events.Add(evt);
            await _context.SaveChangesAsync();
            return evt;
        }

        public async Task<Event> UpdateAsync(Event evt)
        {
            _context.Events.Update(evt);
            await _context.SaveChangesAsync();
            return evt;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var evt = await _context.Events.FindAsync(id);
            if (evt == null) return false;

            _context.Events.Remove(evt);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> SlugExistsAsync(string slug)
        {
            return await _context.Events
                .AnyAsync(e => e.Slug == slug);
        }

        public async Task<IEnumerable<Event>> GetByCreatorIdAsync(int userId)
        {
            return await _context.Events
                .Include(e => e.Guests)
                .Include(e => e.Wishes)
                .Include(e => e.Template)
                .Where(e => e.CreatedByUserId == userId)
                .OrderByDescending(e => e.EventDate)
                .ToListAsync();
        }

        public async Task<IEnumerable<Event>> GetStalePrivateAsync(DateTime olderThan)
        {
            return await _context.Events
                .Where(e => !e.IsPublic && e.CreatedDate < olderThan)
                .ToListAsync();
        }

        public async Task HardDeleteAsync(int id)
        {
            var evt = await _context.Events.FindAsync(id);
            if (evt != null)
            {
                _context.Events.Remove(evt);
                await _context.SaveChangesAsync();
            }
        }
    }
}
