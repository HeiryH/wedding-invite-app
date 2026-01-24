using WeddingInvite.Core.DTOs;
using WeddingInvite.Data.Repositories;
using WeddingInvite.Models;

namespace WeddingInvite.Core.Services
{
    public class FeatureService : IFeatureService
    {
        private readonly IFeatureRepository _featureRepo;
        
        public FeatureService(IFeatureRepository featureRepo)
        {
            _featureRepo = featureRepo;
        }
        
        public async Task<FeatureDto?> GetByIdAsync(int id)
        {
            var feature = await _featureRepo.GetByIdAsync(id);
            if (feature == null) return null;
            
            return MapToDto(feature);
        }
        
        public async Task<FeatureDto?> GetByCodeAsync(string code)
        {
            var feature = await _featureRepo.GetByCodeAsync(code);
            if (feature == null) return null;
            
            return MapToDto(feature);
        }
        
        public async Task<IEnumerable<FeatureDto>> GetAllAsync()
        {
            var features = await _featureRepo.GetAllAsync();
            return features.Select(MapToDto);
        }
        
        public async Task<IEnumerable<FeatureDto>> GetActiveAsync()
        {
            var features = await _featureRepo.GetActiveAsync();
            return features.Select(MapToDto);
        }
        
        public async Task<FeatureDto> CreateAsync(CreateFeatureDto createDto)
        {
            // VALIDATION
            if (string.IsNullOrWhiteSpace(createDto.FeatureCode))
                throw new ArgumentException("Feature code is required");
            
            if (string.IsNullOrWhiteSpace(createDto.FeatureName))
                throw new ArgumentException("Feature name is required");
            
            // Check if code already exists
            var existing = await _featureRepo.GetByCodeAsync(createDto.FeatureCode);
            if (existing != null)
                throw new ArgumentException($"Feature code '{createDto.FeatureCode}' already exists");
            
            // Create feature
            var feature = new Feature
            {
                FeatureCode = createDto.FeatureCode.ToUpper().Trim(),
                FeatureName = createDto.FeatureName.Trim(),
                Description = createDto.Description.Trim(),
                IsPremium = createDto.IsPremium,
                IsActive = true,
                SortOrder = createDto.SortOrder,
                CreatedDate = DateTime.UtcNow
            };
            
            var created = await _featureRepo.CreateAsync(feature);
            return MapToDto(created);
        }
        
        public async Task<FeatureDto> UpdateAsync(int id, UpdateFeatureDto updateDto)
        {
            var feature = await _featureRepo.GetByIdAsync(id);
            if (feature == null)
                throw new KeyNotFoundException($"Feature with ID {id} not found");
            
            // Update fields
            feature.FeatureName = updateDto.FeatureName.Trim();
            feature.Description = updateDto.Description.Trim();
            feature.IsPremium = updateDto.IsPremium;
            feature.IsActive = updateDto.IsActive;
            feature.SortOrder = updateDto.SortOrder;
            
            var updated = await _featureRepo.UpdateAsync(feature);
            return MapToDto(updated);
        }
        
        public async Task<bool> DeleteAsync(int id)
        {
            return await _featureRepo.DeleteAsync(id);
        }
        
        // HELPER METHOD
        private FeatureDto MapToDto(Feature feature)
        {
            return new FeatureDto
            {
                FeatureId = feature.FeatureId,
                FeatureCode = feature.FeatureCode,
                FeatureName = feature.FeatureName,
                Description = feature.Description,
                IsPremium = feature.IsPremium,
                IsActive = feature.IsActive,
                SortOrder = feature.SortOrder
            };
        }
    }
}