using WeddingInvite.Models;

namespace WeddingInvite.Data.Repositories
{
    public interface IGuestRepository
    {
        Task<Guest?> GetByIdAsync(int id);
        Task<IEnumerable<Guest>> GetByWeddingIdAsync(int weddingId);
        Task<Guest> CreateAsync(Guest guest);
        Task<Guest> UpdateAsync(Guest guest);
        Task<bool> DeleteAsync(int id);
        Task<int> GetAttendingCountByWeddingIdAsync(int weddingId);
    }
}