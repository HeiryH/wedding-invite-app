using WeddingInvite.Core.DTOs;

namespace WeddingInvite.Core.Services
{
    public interface IWeddingService
    {
        Task<WeddingDto?> GetByIdAsync(int id);
        Task<WeddingDto?> GetByCoupleNameAsync(string coupleName);
        Task<IEnumerable<WeddingDto>> GetAllAsync();
        Task<WeddingDto> CreateAsync(CreateWeddingDto createDto);
        Task<WeddingDto> UpdateAsync(int id, UpdateWeddingDto updateDto);
        Task<bool> DeleteAsync(int id);
        Task<WeddingDto> UpdateTemplateAsync(int id, int templateId);
        Task<WeddingDto> UpdatePackageAsync(int id, int packageId);
        Task<WeddingDto> ToggleActiveAsync(int id, bool isActive);


    }
}