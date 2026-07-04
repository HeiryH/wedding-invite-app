using WeddingInvite.Models;

namespace WeddingInvite.Data.Repositories
{
    public interface IGuestRepository
    {
        Task<Guest?> GetByIdAsync(int id);
        // skip/take push pagination to the DB; both null = return the full list (unchanged behavior)
        Task<IEnumerable<Guest>> GetByWeddingIdAsync(int weddingId, int? skip = null, int? take = null);
        Task<Guest> CreateAsync(Guest guest);
        Task<Guest> UpdateAsync(Guest guest);
        Task<bool> DeleteAsync(int id);
        Task<int> GetAttendingCountByWeddingIdAsync(int weddingId);
        Task<int> CountByWeddingIdAsync(int weddingId);
    }
}