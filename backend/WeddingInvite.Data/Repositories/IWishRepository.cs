using WeddingInvite.Models;

namespace WeddingInvite.Data.Repositories
{
    public interface IWishRepository
    {
        Task<Wish?> GetByIdAsync(int id);
        Task<IEnumerable<Wish>> GetByWeddingIdAsync(int weddingId);
        Task<Wish> CreateAsync(Wish wish);
        Task<bool> DeleteAsync(int id);
    }
}