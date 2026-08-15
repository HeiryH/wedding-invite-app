using WeddingInvite.Core.DTOs;

namespace WeddingInvite.Core.Services
{
    public interface IEventFeatureService
    {
        Task<IEnumerable<EventFeatureDto>> GetEventFeaturesAsync(int eventId);
        Task<EventWithFeaturesDto> GetEventWithFeaturesAsync(int eventId);
        Task<EventFeatureDto> ToggleFeatureAsync(int eventId, ToggleFeatureDto toggleDto);
        Task<bool> IsFeatureEnabledAsync(int eventId, string featureCode);
        Task<bool> BulkToggleFeaturesAsync(int eventId, List<ToggleFeatureDto> features);
    }
}
