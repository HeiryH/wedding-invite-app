using WeddingInvite.Models;

namespace WeddingInvite.Data.Repositories
{
    public interface IEventFeatureRepository
    {
        Task<EventFeature?> GetAsync(int eventId, int featureId);
        Task<IEnumerable<EventFeature>> GetByEventIdAsync(int eventId);
        Task<EventFeature> EnableFeatureAsync(int eventId, int featureId, string? configuration = null);
        Task<bool> DisableFeatureAsync(int eventId, int featureId);
        Task<bool> IsFeatureEnabledAsync(int eventId, string featureCode);
        Task<Dictionary<int, int>> GetEnabledCountsByFeatureAsync();
    }
}
