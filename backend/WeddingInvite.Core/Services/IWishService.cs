using WeddingInvite.Core.DTOs;

namespace WeddingInvite.Core.Services
{
    public interface IWishService
    {
        Task<WishDto?> GetByIdAsync(int id);
        Task<IEnumerable<WishDto>> GetByEventIdAsync(int eventId);
        Task<WishDto> CreateAsync(int eventId, CreateWishDto createDto);
        Task<bool> DeleteAsync(int id);
    }
}
