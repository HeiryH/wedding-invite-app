using Microsoft.EntityFrameworkCore;
using WeddingInvite.Models;

namespace WeddingInvite.Data.Repositories
{
    public class TemplateRepository : ITemplateRepository
    {
        private readonly AppDbContext _context;
        
        public TemplateRepository(AppDbContext context)
        {
            _context = context;
        }
        
        public async Task<Template?> GetByIdAsync(int id)
        {
            return await _context.Templates.FindAsync(id);
        }
        
        public async Task<Template?> GetByCodeAsync(string code)
        {
            return await _context.Templates
                .FirstOrDefaultAsync(t => t.TemplateCode == code);
        }
        
        public async Task<IEnumerable<Template>> GetAllAsync()
        {
            return await _context.Templates
                .OrderBy(t => t.SortOrder)
                .ThenBy(t => t.TemplateName)
                .ToListAsync();
        }
        
        public async Task<IEnumerable<Template>> GetActiveAsync()
        {
            return await _context.Templates
                .Where(t => t.IsActive)
                .OrderBy(t => t.SortOrder)
                .ThenBy(t => t.TemplateName)
                .ToListAsync();
        }
        
        public async Task<Template> CreateAsync(Template template)
        {
            _context.Templates.Add(template);
            await _context.SaveChangesAsync();
            return template;
        }
        
        public async Task<Template> UpdateAsync(Template template)
        {
            _context.Templates.Update(template);
            await _context.SaveChangesAsync();
            return template;
        }
        
        public async Task<bool> DeleteAsync(int id)
        {
            var template = await _context.Templates.FindAsync(id);
            if (template == null) return false;
            
            _context.Templates.Remove(template);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}