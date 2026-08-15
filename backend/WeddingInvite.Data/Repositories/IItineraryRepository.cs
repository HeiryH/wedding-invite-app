using WeddingInvite.Models;

namespace WeddingInvite.Data.Repositories
{
    public interface IItineraryRepository
    {
        Task<ItineraryItem?> GetByIdAsync(int id);
        Task<IEnumerable<ItineraryItem>> GetByEventIdAsync(int eventId);
        Task<ItineraryItem> CreateAsync(ItineraryItem item);
        Task<ItineraryItem> UpdateAsync(ItineraryItem item);
        Task<bool> DeleteAsync(int id);
        Task ReorderAsync(int eventId, List<(int id, int sortOrder)> updates);
    }
}
