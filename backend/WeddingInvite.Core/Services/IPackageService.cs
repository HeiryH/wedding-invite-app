using WeddingInvite.Core.DTOs;

namespace WeddingInvite.Core.Services
{
    public interface IPackageService
    {
        Task<PackageDto?> GetByIdAsync(int id);
        Task<PackageDto?> GetByCodeAsync(string code);
        Task<IEnumerable<PackageDto>> GetAllAsync();
        Task<IEnumerable<PackageDto>> GetActiveAsync();
        Task<PackageDto> CreateAsync(CreatePackageDto createDto);
        Task<PackageDto> UpdateAsync(int id, UpdatePackageDto updateDto);
        Task<bool> DeleteAsync(int id);
    }
}
