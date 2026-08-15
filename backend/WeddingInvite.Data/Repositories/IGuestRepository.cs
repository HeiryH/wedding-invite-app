using WeddingInvite.Models;

namespace WeddingInvite.Data.Repositories
{
    public interface IGuestRepository
    {
        Task<Guest?> GetByIdAsync(int id);
        // skip/take push pagination to the DB; both null = return the full list (unchanged behavior)
        Task<IEnumerable<Guest>> GetByEventIdAsync(int eventId, int? skip = null, int? take = null);
        Task<Guest> CreateAsync(Guest guest);
        Task<Guest> UpdateAsync(Guest guest);
        Task<bool> DeleteAsync(int id);
        Task<int> GetAttendingCountByEventIdAsync(int eventId);
        Task<int> CountByEventIdAsync(int eventId);
    }
}
