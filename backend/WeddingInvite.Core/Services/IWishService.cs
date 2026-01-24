using WeddingInvite.Core.DTOs;

namespace WeddingInvite.Core.Services
{
    public interface IWishService
    {
        Task<IEnumerable<WishDto>> GetByWeddingIdAsync(int weddingId);
        Task<WishDto> CreateAsync(int weddingId, CreateWishDto createDto);
        Task<bool> DeleteAsync(int id);
    }
}