using WeddingInvite.Core.DTOs;

namespace WeddingInvite.Core.Services
{
    public interface IWeddingFeatureService
    {
        Task<IEnumerable<WeddingFeatureDto>> GetWeddingFeaturesAsync(int weddingId);
        Task<WeddingWithFeaturesDto> GetWeddingWithFeaturesAsync(int weddingId);
        Task<WeddingFeatureDto> ToggleFeatureAsync(int weddingId, ToggleFeatureDto toggleDto);
        Task<bool> IsFeatureEnabledAsync(int weddingId, string featureCode);
        Task<bool> BulkToggleFeaturesAsync(int weddingId, List<ToggleFeatureDto> features);
    }
}