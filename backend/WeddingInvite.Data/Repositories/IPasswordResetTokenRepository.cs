using WeddingInvite.Models;

namespace WeddingInvite.Data.Repositories
{
    public interface IPasswordResetTokenRepository
    {
        Task<PasswordResetToken> CreateAsync(PasswordResetToken token);
        Task<PasswordResetToken?> GetActiveByHashAsync(string tokenHash);
        Task MarkUsedAsync(PasswordResetToken token);
        Task InvalidateAllForUserAsync(int userId);
    }
}
