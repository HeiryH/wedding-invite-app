using WeddingInvite.Core.DTOs;

namespace WeddingInvite.Core.Services
{
    public interface IAuthService
    {
        Task<LoginResponseDto> LoginAsync(LoginDto loginDto);
        Task<LoginResponseDto> RegisterCoupleAsync(RegisterCoupleDto registerDto);
        Task<UserDto> CreateOrganizerAdminForEventAsync(int eventId, string email, string password);
        Task<UserDto?> GetOrganizerAdminAsync(int eventId);
        Task<UserDto> CreateHostAdminAsync(string email, string password);
        Task<IEnumerable<UserDto>> GetAllHostAdminsAsync();
        Task<UserDto> SetActiveAsync(int userId, bool isActive);
        Task<UserDto> SetTierAsync(int userId, string tier);
        Task ResetPasswordAsync(int userId, string newPassword);
        // Self-service reset. RequestPasswordResetAsync never reveals whether the email exists.
        Task RequestPasswordResetAsync(string email, string resetLinkBase);
        Task ResetPasswordWithTokenAsync(string token, string newPassword);
        Task DeleteUserAsync(int userId);
        string GenerateJwtToken(string email, string role, int? eventId, string tier = "BASIC");
    }
}