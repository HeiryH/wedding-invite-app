using Microsoft.EntityFrameworkCore;
using WeddingInvite.Models;

namespace WeddingInvite.Data.Repositories
{
    public class ItineraryRepository : IItineraryRepository
    {
        private readonly AppDbContext _context;

        public ItineraryRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<ItineraryItem?> GetByIdAsync(int id)
        {
            return await _context.ItineraryItems.FindAsync(id);
        }

        public async Task<IEnumerable<ItineraryItem>> GetByWeddingIdAsync(int weddingId)
        {
            return await _context.ItineraryItems
                .Where(i => i.WeddingId == weddingId)
                .OrderBy(i => i.SortOrder)
                .ToListAsync();
        }

        public async Task<ItineraryItem> CreateAsync(ItineraryItem item)
        {
            _context.ItineraryItems.Add(item);
            await _context.SaveChangesAsync();
            return item;
        }

        public async Task<ItineraryItem> UpdateAsync(ItineraryItem item)
        {
            _context.ItineraryItems.Update(item);
            await _context.SaveChangesAsync();
            return item;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var item = await _context.ItineraryItems.FindAsync(id);
            if (item == null) return false;

            _context.ItineraryItems.Remove(item);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task ReorderAsync(int weddingId, List<(int id, int sortOrder)> updates)
        {
            var ids = updates.Select(u => u.id).ToList();
            var items = await _context.ItineraryItems
                .Where(i => i.WeddingId == weddingId && ids.Contains(i.ItineraryItemId))
                .ToListAsync();

            foreach (var item in items)
            {
                var update = updates.FirstOrDefault(u => u.id == item.ItineraryItemId);
                item.SortOrder = update.sortOrder;
            }

            await _context.SaveChangesAsync();
        }
    }
}
