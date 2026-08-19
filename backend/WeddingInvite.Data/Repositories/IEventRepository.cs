using WeddingInvite.Models;

namespace WeddingInvite.Data.Repositories
{
    // Interface = Contract that says "any EventRepository MUST have these methods"
    public interface IEventRepository
    {
        Task<Event?> GetByIdAsync(int id);
        Task<Event?> GetBySlugAsync(string slug);
        Task<Event?> GetByDomainAsync(string domain);
        Task<IEnumerable<Event>> GetAllAsync();
        Task<Event> CreateAsync(Event evt);
        Task<Event> UpdateAsync(Event evt);
        Task<bool> DeleteAsync(int id);
        Task<bool> SlugExistsAsync(string slug);
        Task<IEnumerable<Event>> GetByCreatorIdAsync(int userId);
        Task<IEnumerable<Event>> GetStalePrivateAsync(DateTime olderThan);
        Task HardDeleteAsync(int id);
    }
}
