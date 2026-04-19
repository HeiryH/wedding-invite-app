using WeddingInvite.Models;

namespace WeddingInvite.Data.Repositories
{
    // Interface = Contract that says "any WeddingRepository MUST have these methods"
    public interface IWeddingRepository
    {
        Task<Wedding?> GetByIdAsync(int id);
        Task<Wedding?> GetByCoupleNameAsync(string coupleName);
        Task<IEnumerable<Wedding>> GetAllAsync();
        Task<Wedding> CreateAsync(Wedding wedding);
        Task<Wedding> UpdateAsync(Wedding wedding);
        Task<bool> DeleteAsync(int id);
        Task<bool> CoupleNameExistsAsync(string coupleName);
    }
}