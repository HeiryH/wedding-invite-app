using WeddingInvite.Core.Constants;
using WeddingInvite.Core.DTOs;
using WeddingInvite.Data.Repositories;

namespace WeddingInvite.Core.Services
{
    public class EventFeatureService : IEventFeatureService
    {
        private readonly IEventFeatureRepository _eventFeatureRepo;
        private readonly IEventRepository _eventRepo;
        private readonly IFeatureRepository _featureRepo;
        private readonly IUserRepository _userRepo;
        private readonly IPackageRepository _packageRepo;

        public EventFeatureService(
            IEventFeatureRepository eventFeatureRepo,
            IEventRepository eventRepo,
            IFeatureRepository featureRepo,
            IUserRepository userRepo,
            IPackageRepository packageRepo)
        {
            _eventFeatureRepo = eventFeatureRepo;
            _eventRepo = eventRepo;
            _featureRepo = featureRepo;
            _userRepo = userRepo;
            _packageRepo = packageRepo;
        }

        public async Task<IEnumerable<EventFeatureDto>> GetEventFeaturesAsync(int eventId)
        {
            var eventFeatures = await _eventFeatureRepo.GetByEventIdAsync(eventId);
            return eventFeatures.Select(ef => new EventFeatureDto
            {
                EventFeatureId = ef.EventFeatureId,
                EventId = ef.EventId,
                FeatureId = ef.FeatureId,
                FeatureCode = ef.Feature.FeatureCode,
                FeatureName = ef.Feature.FeatureName,
                Description = ef.Feature.Description,
                IsEnabled = ef.IsEnabled,
                IsPremium = ef.Feature.IsPremium,
                Configuration = ef.Configuration,
                EnabledDate = ef.EnabledDate
            });
        }

        public async Task<EventWithFeaturesDto> GetEventWithFeaturesAsync(int eventId)
        {
            // Get event
            var evt = await _eventRepo.GetByIdAsync(eventId);
            if (evt == null)
                throw new KeyNotFoundException($"Event with ID {eventId} not found");

            // Get all active features
            var allFeatures = await _featureRepo.GetActiveAsync();

            // Get event's enabled features
            var eventFeatures = await _eventFeatureRepo.GetByEventIdAsync(eventId);

            // Create DTOs for all features (enabled or not)
            var featureDtos = allFeatures.Select(feature =>
            {
                var eventFeature = eventFeatures.FirstOrDefault(ef => ef.FeatureId == feature.FeatureId);

                return new EventFeatureDto
                {
                    EventFeatureId = eventFeature?.EventFeatureId ?? 0,
                    EventId = eventId,
                    FeatureId = feature.FeatureId,
                    FeatureCode = feature.FeatureCode,
                    FeatureName = feature.FeatureName,
                    Description = feature.Description,
                    IsEnabled = eventFeature?.IsEnabled ?? false,
                    IsPremium = feature.IsPremium,
                    Configuration = eventFeature?.Configuration,
                    EnabledDate = eventFeature?.EnabledDate ?? DateTime.UtcNow
                };
            }).ToList();

            return new EventWithFeaturesDto
            {
                Event = new EventDto
                {
                    EventId = evt.EventId,
                    Slug = evt.Slug,
                    EventType = evt.EventType,
                    Name1 = evt.Name1,
                    Name2 = evt.Name2,
                    EventTitle = evt.EventTitle,
                    DisplayName = Utilities.EventNaming.GetDisplayName(evt.EventType, evt.Name1, evt.Name2, evt.EventTitle),
                    EventDate = evt.EventDate,
                    Venue = evt.Venue,
                    VenueAddress = evt.VenueAddress,
                    TotalGuests = evt.Guests.Count,
                    TotalAttending = evt.Guests.Where(g => g.IsAttending).Sum(g => g.NumberOfAttendees),
                    DaysUntilEvent = (evt.EventDate - DateTime.UtcNow).Days > 0
                        ? (evt.EventDate - DateTime.UtcNow).Days
                        : 0,
                    TotalPhotos = evt.Photos.Count,
                    EnabledFeaturesCount = featureDtos.Count(f => f.IsEnabled)
                },
                Features = featureDtos
            };
        }

        public async Task<EventFeatureDto> ToggleFeatureAsync(int eventId, ToggleFeatureDto toggleDto)
        {
            // VALIDATION
            var evt = await _eventRepo.GetByIdAsync(eventId);
            if (evt == null)
                throw new KeyNotFoundException($"Event with ID {eventId} not found");

            var feature = await _featureRepo.GetByIdAsync(toggleDto.FeatureId);
            if (feature == null)
                throw new KeyNotFoundException($"Feature with ID {toggleDto.FeatureId} not found");

            if (!feature.IsActive)
                throw new InvalidOperationException($"Feature '{feature.FeatureName}' is not available");

            // Toggle feature
            if (toggleDto.IsEnabled)
            {
                // Tier ceiling: an event can only enable features its tier permits.
                // The governing tier is the couple admin's tier (manual, admin-set).
                var owner = await _userRepo.GetByEventIdAsync(eventId);
                var tier = owner?.Tier ?? TierEntitlements.Basic;
                if (!await _packageRepo.TierIncludesFeatureAsync(tier, feature.FeatureCode))
                    throw new InvalidOperationException(
                        $"'{feature.FeatureName}' isn't available on the {tier} tier. Upgrade the event to enable it.");

                var eventFeature = await _eventFeatureRepo.EnableFeatureAsync(
                    eventId,
                    toggleDto.FeatureId,
                    toggleDto.Configuration
                );

                return new EventFeatureDto
                {
                    EventFeatureId = eventFeature.EventFeatureId,
                    EventId = eventFeature.EventId,
                    FeatureId = eventFeature.FeatureId,
                    FeatureCode = feature.FeatureCode,
                    FeatureName = feature.FeatureName,
                    Description = feature.Description,
                    IsEnabled = eventFeature.IsEnabled,
                    IsPremium = feature.IsPremium,
                    Configuration = eventFeature.Configuration,
                    EnabledDate = eventFeature.EnabledDate
                };
            }
            else
            {
                await _eventFeatureRepo.DisableFeatureAsync(eventId, toggleDto.FeatureId);

                return new EventFeatureDto
                {
                    EventId = eventId,
                    FeatureId = toggleDto.FeatureId,
                    FeatureCode = feature.FeatureCode,
                    FeatureName = feature.FeatureName,
                    Description = feature.Description,
                    IsEnabled = false,
                    IsPremium = feature.IsPremium
                };
            }
        }

        public async Task<bool> IsFeatureEnabledAsync(int eventId, string featureCode)
        {
            return await _eventFeatureRepo.IsFeatureEnabledAsync(eventId, featureCode);
        }

        public async Task<bool> BulkToggleFeaturesAsync(int eventId, List<ToggleFeatureDto> features)
        {
            // Validate event exists
            var evt = await _eventRepo.GetByIdAsync(eventId);
            if (evt == null)
                throw new KeyNotFoundException($"Event with ID {eventId} not found");

            // Toggle each feature
            foreach (var toggleDto in features)
            {
                await ToggleFeatureAsync(eventId, toggleDto);
            }

            return true;
        }
    }
}
