using WeddingInvite.Core.DTOs;

namespace WeddingInvite.Core.Services
{
    public interface IFeatureService
    {
        Task<FeatureDto?> GetByIdAsync(int id);
        Task<FeatureDto?> GetByCodeAsync(string code);
        Task<IEnumerable<FeatureDto>> GetAllAsync();
        Task<IEnumerable<FeatureDto>> GetActiveAsync();
        Task<IEnumerable<FeatureUsageDto>> GetAllWithUsageAsync();
        Task<FeatureDto> CreateAsync(CreateFeatureDto createDto);
        Task<FeatureDto> UpdateAsync(int id, UpdateFeatureDto updateDto);
        Task<bool> DeleteAsync(int id);
    }
}