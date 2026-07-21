using Microsoft.EntityFrameworkCore;
using WeddingInvite.Models;

namespace WeddingInvite.Data.Repositories
{
    public class TemplateConfigRepository : ITemplateConfigRepository
    {
        private readonly AppDbContext _context;

        public TemplateConfigRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<WeddingTemplateConfig>> GetByWeddingIdAsync(int weddingId)
        {
            return await _context.TemplateConfigs
                .Where(c => c.WeddingId == weddingId)
                .ToListAsync();
        }

        public async Task UpsertAsync(
            int weddingId,
            Dictionary<string, string> configs,
            Func<string, bool> canPrune)
        {
            var existing = await _context.TemplateConfigs
                .Where(c => c.WeddingId == weddingId)
                .ToDictionaryAsync(c => c.ConfigKey, StringComparer.Ordinal);

            foreach (var (key, value) in configs)
            {
                if (existing.TryGetValue(key, out var row))
                {
                    if (row.ConfigValue == value) continue;
                    row.ConfigValue = value;
                    row.UpdatedDate = DateTime.UtcNow;
                }
                else
                {
                    _context.TemplateConfigs.Add(new WeddingTemplateConfig
                    {
                        WeddingId = weddingId,
                        ConfigKey = key,
                        ConfigValue = value,
                        UpdatedDate = DateTime.UtcNow
                    });
                }
            }

            // A key the caller could have written but didn't submit has been removed — e.g. a deleted
            // layer, or a key belonging to a template they just switched away from. Keys the caller
            // may NOT write are left alone, so a couple's save can't wipe admin-authored config.
            var stale = existing
                .Where(kv => !configs.ContainsKey(kv.Key) && canPrune(kv.Key))
                .Select(kv => kv.Value);

            _context.TemplateConfigs.RemoveRange(stale);

            await _context.SaveChangesAsync();
        }
    }
}
