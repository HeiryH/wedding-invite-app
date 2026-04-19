using WeddingInvite.Core.DTOs;


namespace WeddingInvite.Core.Services
{
    public interface IWeddingAuthorizationService
    {
        Task<bool> CanAccessWeddingAsync(string userEmail, int weddingId);
        Task<bool> IsSuperAdminAsync(string userEmail);
        Task<int?> GetUserWeddingIdAsync(string userEmail);
    }
}