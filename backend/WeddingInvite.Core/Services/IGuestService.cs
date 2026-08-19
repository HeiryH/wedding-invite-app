using WeddingInvite.Core.DTOs;

namespace WeddingInvite.Core.Services
{
    public interface IGuestService
    {
        Task<GuestDto?> GetByIdAsync(int id);
        // page/pageSize both null = full list (unchanged); otherwise returns that page
        Task<IEnumerable<GuestDto>> GetByEventIdAsync(int eventId, int? page = null, int? pageSize = null);
        Task<GuestDto> CreateAsync(int eventId, CreateGuestDto createDto, bool enforceRsvpOpen = false);
        Task<GuestDto> UpdateAsync(int id, UpdateGuestDto updateDto);
        Task<bool> DeleteAsync(int id);
        Task<int> GetAttendingCountAsync(int eventId);
        Task<int> GetCountAsync(int eventId);
    }
}
