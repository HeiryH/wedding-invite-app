using WeddingInvite.Core.DTOs;

namespace WeddingInvite.Core.Services
{
    public interface IItineraryService
    {
        Task<ItineraryItemDto?> GetByIdAsync(int id);
        Task<IEnumerable<ItineraryItemDto>> GetByEventIdAsync(int eventId);
        Task<ItineraryItemDto> CreateAsync(int eventId, CreateItineraryItemDto dto);
        Task<ItineraryItemDto> UpdateAsync(int id, UpdateItineraryItemDto dto);
        Task<bool> DeleteAsync(int id);
        Task ReorderAsync(int eventId, ReorderItineraryDto dto);
    }
}
