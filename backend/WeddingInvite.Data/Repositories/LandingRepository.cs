using Microsoft.EntityFrameworkCore;
using WeddingInvite.Models;

namespace WeddingInvite.Data.Repositories
{
    public class LandingRepository : ILandingRepository
    {
        private readonly AppDbContext _context;

        public LandingRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<LandingContentItem>> GetContentAsync() =>
            await _context.LandingContent.AsNoTracking().ToListAsync();

        public async Task<List<LandingSection>> GetSectionsAsync() =>
            await _context.LandingSections.AsNoTracking().OrderBy(s => s.SortOrder).ToListAsync();

        public async Task<List<LandingItem>> GetItemsAsync() =>
            await _context.LandingItems.AsNoTracking().OrderBy(i => i.SortOrder).ToListAsync();

        public async Task SaveContentAsync(Dictionary<string, string> content)
        {
            var existing = await _context.LandingContent.ToListAsync();
            var byKey = existing.ToDictionary(e => e.ContentKey);
            foreach (var (key, value) in content)
            {
                if (byKey.TryGetValue(key, out var row))
                {
                    if (row.ContentValue != value) row.ContentValue = value;
                }
                else
                {
                    _context.LandingContent.Add(new LandingContentItem { ContentKey = key, ContentValue = value });
                }
            }
            await _context.SaveChangesAsync();
        }

        public async Task<LandingSection> UpsertSectionAsync(LandingSection section)
        {
            var row = await _context.LandingSections.FirstOrDefaultAsync(s => s.SectionKey == section.SectionKey);
            if (row == null)
            {
                _context.LandingSections.Add(section);
                await _context.SaveChangesAsync();
                return section;
            }
            row.Title = section.Title;
            row.SortOrder = section.SortOrder;
            row.IsVisible = section.IsVisible;
            await _context.SaveChangesAsync();
            return row;
        }

        public async Task<LandingItem> CreateItemAsync(LandingItem item)
        {
            _context.LandingItems.Add(item);
            await _context.SaveChangesAsync();
            return item;
        }

        public async Task<LandingItem?> UpdateItemAsync(int id, LandingItem patch)
        {
            var row = await _context.LandingItems.FindAsync(id);
            if (row == null) return null;
            row.SectionKey = patch.SectionKey;
            row.SortOrder = patch.SortOrder;
            row.IsActive = patch.IsActive;
            row.Title = patch.Title;
            row.Body = patch.Body;
            row.ImageUrl = patch.ImageUrl;
            row.Meta = patch.Meta;
            await _context.SaveChangesAsync();
            return row;
        }

        public async Task<bool> DeleteItemAsync(int id)
        {
            var row = await _context.LandingItems.FindAsync(id);
            if (row == null) return false;
            _context.LandingItems.Remove(row);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
