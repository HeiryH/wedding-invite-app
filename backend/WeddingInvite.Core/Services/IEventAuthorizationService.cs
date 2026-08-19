using WeddingInvite.Core.DTOs;


namespace WeddingInvite.Core.Services
{
    public interface IEventAuthorizationService
    {
        Task<bool> CanAccessEventAsync(string userEmail, int eventId);
        Task<bool> IsSuperAdminAsync(string userEmail);
        Task<int?> GetUserEventIdAsync(string userEmail);
    }
}
