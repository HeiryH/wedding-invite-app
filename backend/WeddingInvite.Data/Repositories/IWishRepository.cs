using WeddingInvite.Models;

namespace WeddingInvite.Data.Repositories
{
    public interface IWishRepository
    {
        Task<Wish?> GetByIdAsync(int id);
        Task<IEnumerable<Wish>> GetByEventIdAsync(int eventId);
        Task<Wish> CreateAsync(Wish wish);
        Task<bool> DeleteAsync(int id);
    }
}
