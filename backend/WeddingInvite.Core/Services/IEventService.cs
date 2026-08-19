using WeddingInvite.Core.DTOs;

namespace WeddingInvite.Core.Services
{
    public interface IEventService
    {
        Task<EventDto?> GetByIdAsync(int id);
        Task<EventDto?> GetBySlugAsync(string slug);
        Task<IEnumerable<EventDto>> GetAllAsync();
        Task<IEnumerable<EventDto>> GetByCreatorAsync(int userId);
        Task<EventDto> CreateAsync(CreateEventDto createDto, int? createdByUserId = null);
        Task<EventDto> UpdateAsync(int id, UpdateEventDto updateDto);
        Task<bool> DeleteAsync(int id);
        Task<EventDto> UpdateTemplateAsync(int id, int templateId);
        Task<EventDto> ToggleActiveAsync(int id, bool isActive);
        Task<EventDto> ToggleRsvpAsync(int id, bool isRsvpOpen);
        Task<EventDto> SetDomainAsync(int id, string? domain);
        Task<EventDto?> GetByDomainAsync(string domain);
        Task<int> PruneStalePrivateAsync(int daysOld);
    }
}
