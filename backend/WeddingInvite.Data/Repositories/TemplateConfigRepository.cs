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

        public async Task UpsertAsync(int weddingId, Dictionary<string, string> configs)
        {
            foreach (var (key, value) in configs)
            {
                var existing = await _context.TemplateConfigs
                    .FirstOrDefaultAsync(c => c.WeddingId == weddingId && c.ConfigKey == key);

                if (existing != null)
                {
                    existing.ConfigValue = value;
                    existing.UpdatedDate = DateTime.UtcNow;
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

            await _context.SaveChangesAsync();
        }
    }
}
