using WeddingInvite.Core.DTOs;
using WeddingInvite.Data.Repositories;

namespace WeddingInvite.Core.Services
{
    public class WeddingFeatureService : IWeddingFeatureService
    {
        private readonly IWeddingFeatureRepository _weddingFeatureRepo;
        private readonly IWeddingRepository _weddingRepo;
        private readonly IFeatureRepository _featureRepo;
        
        public WeddingFeatureService(
            IWeddingFeatureRepository weddingFeatureRepo,
            IWeddingRepository weddingRepo,
            IFeatureRepository featureRepo)
        {
            _weddingFeatureRepo = weddingFeatureRepo;
            _weddingRepo = weddingRepo;
            _featureRepo = featureRepo;
        }
        
        public async Task<IEnumerable<WeddingFeatureDto>> GetWeddingFeaturesAsync(int weddingId)
        {
            var weddingFeatures = await _weddingFeatureRepo.GetByWeddingIdAsync(weddingId);
            return weddingFeatures.Select(wf => new WeddingFeatureDto
            {
                WeddingFeatureId = wf.WeddingFeatureId,
                WeddingId = wf.WeddingId,
                FeatureId = wf.FeatureId,
                FeatureCode = wf.Feature.FeatureCode,
                FeatureName = wf.Feature.FeatureName,
                Description = wf.Feature.Description,
                IsEnabled = wf.IsEnabled,
                IsPremium = wf.Feature.IsPremium,
                Configuration = wf.Configuration,
                EnabledDate = wf.EnabledDate
            });
        }
        
        public async Task<WeddingWithFeaturesDto> GetWeddingWithFeaturesAsync(int weddingId)
        {
            // Get wedding
            var wedding = await _weddingRepo.GetByIdAsync(weddingId);
            if (wedding == null)
                throw new KeyNotFoundException($"Wedding with ID {weddingId} not found");
            
            // Get all active features
            var allFeatures = await _featureRepo.GetActiveAsync();
            
            // Get wedding's enabled features
            var weddingFeatures = await _weddingFeatureRepo.GetByWeddingIdAsync(weddingId);
            
            // Create DTOs for all features (enabled or not)
            var featureDtos = allFeatures.Select(feature =>
            {
                var weddingFeature = weddingFeatures.FirstOrDefault(wf => wf.FeatureId == feature.FeatureId);
                
                return new WeddingFeatureDto
                {
                    WeddingFeatureId = weddingFeature?.WeddingFeatureId ?? 0,
                    WeddingId = weddingId,
                    FeatureId = feature.FeatureId,
                    FeatureCode = feature.FeatureCode,
                    FeatureName = feature.FeatureName,
                    Description = feature.Description,
                    IsEnabled = weddingFeature?.IsEnabled ?? false,
                    IsPremium = feature.IsPremium,
                    Configuration = weddingFeature?.Configuration,
                    EnabledDate = weddingFeature?.EnabledDate ?? DateTime.UtcNow
                };
            }).ToList();
            
            return new WeddingWithFeaturesDto
            {
                Wedding = new WeddingDto
                {
                    WeddingId = wedding.WeddingId,
                    CoupleName = wedding.CoupleName,
                    BrideName = wedding.BrideName,
                    GroomName = wedding.GroomName,
                    WeddingDate = wedding.WeddingDate,
                    Venue = wedding.Venue,
                    VenueAddress = wedding.VenueAddress,
                    TotalGuests = wedding.Guests.Count,
                    TotalAttending = wedding.Guests.Where(g => g.IsAttending).Sum(g => g.NumberOfAttendees),
                    DaysUntilWedding = (wedding.WeddingDate - DateTime.UtcNow).Days > 0 
                        ? (wedding.WeddingDate - DateTime.UtcNow).Days 
                        : 0,
                    TotalPhotos = wedding.Photos.Count,
                    EnabledFeaturesCount = featureDtos.Count(f => f.IsEnabled)
                },
                Features = featureDtos
            };
        }
        
        public async Task<WeddingFeatureDto> ToggleFeatureAsync(int weddingId, ToggleFeatureDto toggleDto)
        {
            // VALIDATION
            var wedding = await _weddingRepo.GetByIdAsync(weddingId);
            if (wedding == null)
                throw new KeyNotFoundException($"Wedding with ID {weddingId} not found");
            
            var feature = await _featureRepo.GetByIdAsync(toggleDto.FeatureId);
            if (feature == null)
                throw new KeyNotFoundException($"Feature with ID {toggleDto.FeatureId} not found");
            
            if (!feature.IsActive)
                throw new InvalidOperationException($"Feature '{feature.FeatureName}' is not available");
            
            // Toggle feature
            if (toggleDto.IsEnabled)
            {
                var weddingFeature = await _weddingFeatureRepo.EnableFeatureAsync(
                    weddingId, 
                    toggleDto.FeatureId, 
                    toggleDto.Configuration
                );
                
                return new WeddingFeatureDto
                {
                    WeddingFeatureId = weddingFeature.WeddingFeatureId,
                    WeddingId = weddingFeature.WeddingId,
                    FeatureId = weddingFeature.FeatureId,
                    FeatureCode = feature.FeatureCode,
                    FeatureName = feature.FeatureName,
                    Description = feature.Description,
                    IsEnabled = weddingFeature.IsEnabled,
                    IsPremium = feature.IsPremium,
                    Configuration = weddingFeature.Configuration,
                    EnabledDate = weddingFeature.EnabledDate
                };
            }
            else
            {
                await _weddingFeatureRepo.DisableFeatureAsync(weddingId, toggleDto.FeatureId);
                
                return new WeddingFeatureDto
                {
                    WeddingId = weddingId,
                    FeatureId = toggleDto.FeatureId,
                    FeatureCode = feature.FeatureCode,
                    FeatureName = feature.FeatureName,
                    Description = feature.Description,
                    IsEnabled = false,
                    IsPremium = feature.IsPremium
                };
            }
        }
        
        public async Task<bool> IsFeatureEnabledAsync(int weddingId, string featureCode)
        {
            return await _weddingFeatureRepo.IsFeatureEnabledAsync(weddingId, featureCode);
        }
        
        public async Task<bool> BulkToggleFeaturesAsync(int weddingId, List<ToggleFeatureDto> features)
        {
            // Validate wedding exists
            var wedding = await _weddingRepo.GetByIdAsync(weddingId);
            if (wedding == null)
                throw new KeyNotFoundException($"Wedding with ID {weddingId} not found");
            
            // Toggle each feature
            foreach (var toggleDto in features)
            {
                await ToggleFeatureAsync(weddingId, toggleDto);
            }
            
            return true;
        }
    }
}