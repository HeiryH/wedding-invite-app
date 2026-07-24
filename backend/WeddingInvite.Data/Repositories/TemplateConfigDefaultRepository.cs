using Microsoft.EntityFrameworkCore;
using WeddingInvite.Models;

namespace WeddingInvite.Data.Repositories
{
    public class TemplateConfigDefaultRepository : ITemplateConfigDefaultRepository
    {
        private readonly AppDbContext _context;

        public TemplateConfigDefaultRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Dictionary<string, string>> GetByTemplateIdAsync(int templateId)
        {
            return await _context.TemplateConfigDefaults
                .Where(c => c.TemplateId == templateId)
                .ToDictionaryAsync(c => c.ConfigKey, c => c.ConfigValue);
        }

        public async Task<int> CountAsync(int templateId)
        {
            return await _context.TemplateConfigDefaults
                .CountAsync(c => c.TemplateId == templateId);
        }

        public async Task ReplaceAsync(int templateId, Dictionary<string, string> configs)
        {
            var existing = await _context.TemplateConfigDefaults
                .Where(c => c.TemplateId == templateId)
                .ToListAsync();

            _context.TemplateConfigDefaults.RemoveRange(existing);

            foreach (var (key, value) in configs)
            {
                _context.TemplateConfigDefaults.Add(new TemplateConfigDefault
                {
                    TemplateId = templateId,
                    ConfigKey = key,
                    ConfigValue = value,
                    UpdatedDate = DateTime.UtcNow
                });
            }

            await _context.SaveChangesAsync();
        }
    }
}
