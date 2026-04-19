using WeddingInvite.Models;

namespace WeddingInvite.Data.Repositories
{
    public interface IWeddingFeatureRepository
    {
        Task<WeddingFeature?> GetAsync(int weddingId, int featureId);
        Task<IEnumerable<WeddingFeature>> GetByWeddingIdAsync(int weddingId);
        Task<WeddingFeature> EnableFeatureAsync(int weddingId, int featureId, string? configuration = null);
        Task<bool> DisableFeatureAsync(int weddingId, int featureId);
        Task<bool> IsFeatureEnabledAsync(int weddingId, string featureCode);
    }
}