using WeddingInvite.Models;

namespace WeddingInvite.Data.Repositories
{
    public interface IFeatureRepository
    {
        Task<Feature?> GetByIdAsync(int id);
        Task<Feature?> GetByCodeAsync(string code);
        Task<IEnumerable<Feature>> GetAllAsync();
        Task<IEnumerable<Feature>> GetActiveAsync();
        Task<Feature> CreateAsync(Feature feature);
        Task<Feature> UpdateAsync(Feature feature);
        Task<bool> DeleteAsync(int id);
    }
}