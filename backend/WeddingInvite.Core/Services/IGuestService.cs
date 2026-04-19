using WeddingInvite.Core.DTOs;

namespace WeddingInvite.Core.Services
{
    public interface IGuestService
    {
        Task<GuestDto?> GetByIdAsync(int id);
        Task<IEnumerable<GuestDto>> GetByWeddingIdAsync(int weddingId);
        Task<GuestDto> CreateAsync(int weddingId, CreateGuestDto createDto);
        Task<GuestDto> UpdateAsync(int id, UpdateGuestDto updateDto);
        Task<bool> DeleteAsync(int id);
        Task<int> GetAttendingCountAsync(int weddingId);
    }
}