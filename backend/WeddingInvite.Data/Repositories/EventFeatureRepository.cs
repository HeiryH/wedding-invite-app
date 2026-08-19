using Microsoft.EntityFrameworkCore;
using WeddingInvite.Models;

namespace WeddingInvite.Data.Repositories
{
    public class EventFeatureRepository : IEventFeatureRepository
    {
        private readonly AppDbContext _context;

        public EventFeatureRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<EventFeature?> GetAsync(int eventId, int featureId)
        {
            return await _context.EventFeatures
                .Include(ef => ef.Feature)
                .FirstOrDefaultAsync(ef =>
                    ef.EventId == eventId && ef.FeatureId == featureId
                );
        }

        public async Task<IEnumerable<EventFeature>> GetByEventIdAsync(int eventId)
        {
            return await _context.EventFeatures
                .Include(ef => ef.Feature)
                .Where(ef => ef.EventId == eventId)
                .ToListAsync();
        }

        public async Task<EventFeature> EnableFeatureAsync(
            int eventId,
            int featureId,
            string? configuration = null)
        {
            // Check if already exists
            var existing = await GetAsync(eventId, featureId);

            if (existing != null)
            {
                // Update existing
                existing.IsEnabled = true;
                existing.Configuration = configuration;
                existing.EnabledDate = DateTime.UtcNow;
                _context.EventFeatures.Update(existing);
            }
            else
            {
                // Create new
                existing = new EventFeature
                {
                    EventId = eventId,
                    FeatureId = featureId,
                    IsEnabled = true,
                    Configuration = configuration,
                    EnabledDate = DateTime.UtcNow
                };
                _context.EventFeatures.Add(existing);
            }

            await _context.SaveChangesAsync();
            return existing;
        }

        public async Task<bool> DisableFeatureAsync(int eventId, int featureId)
        {
            var eventFeature = await GetAsync(eventId, featureId);
            if (eventFeature == null) return false;

            eventFeature.IsEnabled = false;
            _context.EventFeatures.Update(eventFeature);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<bool> IsFeatureEnabledAsync(int eventId, string featureCode)
        {
            return await _context.EventFeatures
                .Include(ef => ef.Feature)
                .AnyAsync(ef =>
                    ef.EventId == eventId &&
                    ef.Feature.FeatureCode == featureCode &&
                    ef.IsEnabled
                );
        }

        public async Task<Dictionary<int, int>> GetEnabledCountsByFeatureAsync()
        {
            return await _context.EventFeatures
                .Where(ef => ef.IsEnabled)
                .GroupBy(ef => ef.FeatureId)
                .Select(g => new { FeatureId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.FeatureId, x => x.Count);
        }
    }
}
