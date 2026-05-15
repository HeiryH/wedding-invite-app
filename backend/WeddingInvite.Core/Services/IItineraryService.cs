using WeddingInvite.Core.DTOs;

namespace WeddingInvite.Core.Services
{
    public interface IItineraryService
    {
        Task<ItineraryItemDto?> GetByIdAsync(int id);
        Task<IEnumerable<ItineraryItemDto>> GetByWeddingIdAsync(int weddingId);
        Task<ItineraryItemDto> CreateAsync(int weddingId, CreateItineraryItemDto dto);
        Task<ItineraryItemDto> UpdateAsync(int id, UpdateItineraryItemDto dto);
        Task<bool> DeleteAsync(int id);
        Task ReorderAsync(int weddingId, ReorderItineraryDto dto);
    }
}
