using WeddingInvite.Models;

namespace WeddingInvite.Data.Repositories
{
    public interface IPackageRepository
    {
        Task<Package?> GetByIdAsync(int id);
        Task<Package?> GetByCodeAsync(string code);
        Task<IEnumerable<Package>> GetAllAsync();
        Task<IEnumerable<Package>> GetActiveAsync();
        Task<Package> CreateAsync(Package package);
        Task<Package> UpdateAsync(Package package);
        Task<bool> DeleteAsync(int id);
        Task<bool> NameExistsAsync(string name, int? excludeId = null);
        Task<bool> CodeExistsAsync(string code, int? excludeId = null);
    }
}
