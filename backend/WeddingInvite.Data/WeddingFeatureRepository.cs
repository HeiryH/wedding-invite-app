using Microsoft.EntityFrameworkCore;
using WeddingInvite.Models;

namespace WeddingInvite.Data.Repositories
{
    public class WeddingFeatureRepository : IWeddingFeatureRepository
    {
        private readonly AppDbContext _context;
        
        public WeddingFeatureRepository(AppDbContext context)
        {
            _context = context;
        }
        
        public async Task<WeddingFeature?> GetAsync(int weddingId, int featureId)
        {
            return await _context.WeddingFeatures
                .Include(wf => wf.Feature)
                .FirstOrDefaultAsync(wf => 
                    wf.WeddingId == weddingId && wf.FeatureId == featureId
                );
        }
        
        public async Task<IEnumerable<WeddingFeature>> GetByWeddingIdAsync(int weddingId)
        {
            return await _context.WeddingFeatures
                .Include(wf => wf.Feature)
                .Where(wf => wf.WeddingId == weddingId)
                .ToListAsync();
        }
        
        public async Task<WeddingFeature> EnableFeatureAsync(
            int weddingId, 
            int featureId, 
            string? configuration = null)
        {
            // Check if already exists
            var existing = await GetAsync(weddingId, featureId);
            
            if (existing != null)
            {
                // Update existing
                existing.IsEnabled = true;
                existing.Configuration = configuration;
                existing.EnabledDate = DateTime.UtcNow;
                _context.WeddingFeatures.Update(existing);
            }
            else
            {
                // Create new
                existing = new WeddingFeature
                {
                    WeddingId = weddingId,
                    FeatureId = featureId,
                    IsEnabled = true,
                    Configuration = configuration,
                    EnabledDate = DateTime.UtcNow
                };
                _context.WeddingFeatures.Add(existing);
            }
            
            await _context.SaveChangesAsync();
            return existing;
        }
        
        public async Task<bool> DisableFeatureAsync(int weddingId, int featureId)
        {
            var weddingFeature = await GetAsync(weddingId, featureId);
            if (weddingFeature == null) return false;
            
            weddingFeature.IsEnabled = false;
            _context.WeddingFeatures.Update(weddingFeature);
            await _context.SaveChangesAsync();
            
            return true;
        }
        
        public async Task<bool> IsFeatureEnabledAsync(int weddingId, string featureCode)
        {
            return await _context.WeddingFeatures
                .Include(wf => wf.Feature)
                .AnyAsync(wf => 
                    wf.WeddingId == weddingId && 
                    wf.Feature.FeatureCode == featureCode && 
                    wf.IsEnabled
                );
        }
    }
}