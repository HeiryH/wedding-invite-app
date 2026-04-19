using Microsoft.EntityFrameworkCore;
using WeddingInvite.Models;

namespace WeddingInvite.Data.Repositories
{
    public class FeatureRepository : IFeatureRepository
    {
        private readonly AppDbContext _context;
        
        public FeatureRepository(AppDbContext context)
        {
            _context = context;
        }
        
        public async Task<Feature?> GetByIdAsync(int id)
        {
            return await _context.Features.FindAsync(id);
        }
        
        public async Task<Feature?> GetByCodeAsync(string code)
        {
            return await _context.Features
                .FirstOrDefaultAsync(f => f.FeatureCode == code);
        }
        
        public async Task<IEnumerable<Feature>> GetAllAsync()
        {
            return await _context.Features
                .OrderBy(f => f.SortOrder)
                .ThenBy(f => f.FeatureName)
                .ToListAsync();
        }
        
        public async Task<IEnumerable<Feature>> GetActiveAsync()
        {
            return await _context.Features
                .Where(f => f.IsActive)
                .OrderBy(f => f.SortOrder)
                .ThenBy(f => f.FeatureName)
                .ToListAsync();
        }
        
        public async Task<Feature> CreateAsync(Feature feature)
        {
            _context.Features.Add(feature);
            await _context.SaveChangesAsync();
            return feature;
        }
        
        public async Task<Feature> UpdateAsync(Feature feature)
        {
            _context.Features.Update(feature);
            await _context.SaveChangesAsync();
            return feature;
        }
        
        public async Task<bool> DeleteAsync(int id)
        {
            var feature = await _context.Features.FindAsync(id);
            if (feature == null) return false;
            
            _context.Features.Remove(feature);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}