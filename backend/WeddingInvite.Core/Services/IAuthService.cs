using WeddingInvite.Core.DTOs;

namespace WeddingInvite.Core.Services
{
    public interface IAuthService
    {
        Task<LoginResponseDto> LoginAsync(LoginDto loginDto);
        Task<LoginResponseDto> RegisterCoupleAsync(RegisterCoupleDto registerDto);
        Task<UserDto> CreateCoupleAdminForWeddingAsync(int weddingId, string email, string password);
        Task<UserDto?> GetCoupleAdminAsync(int weddingId);
        Task<UserDto> SetActiveAsync(int userId, bool isActive);
        Task ResetPasswordAsync(int userId, string newPassword);
        Task DeleteUserAsync(int userId);
        string GenerateJwtToken(string email, string role, int? weddingId);
    }
}