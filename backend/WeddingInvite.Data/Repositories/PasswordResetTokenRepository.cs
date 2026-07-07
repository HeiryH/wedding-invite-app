using Microsoft.EntityFrameworkCore;
using WeddingInvite.Models;

namespace WeddingInvite.Data.Repositories
{
    public class PasswordResetTokenRepository : IPasswordResetTokenRepository
    {
        private readonly AppDbContext _context;

        public PasswordResetTokenRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<PasswordResetToken> CreateAsync(PasswordResetToken token)
        {
            _context.PasswordResetTokens.Add(token);
            await _context.SaveChangesAsync();
            return token;
        }

        /// <summary>Returns the token only if it exists, is unused, and hasn't expired.</summary>
        public async Task<PasswordResetToken?> GetActiveByHashAsync(string tokenHash)
        {
            return await _context.PasswordResetTokens
                .Include(t => t.User)
                .FirstOrDefaultAsync(t =>
                    t.TokenHash == tokenHash &&
                    t.UsedAt == null &&
                    t.ExpiresAt > DateTime.UtcNow);
        }

        public async Task MarkUsedAsync(PasswordResetToken token)
        {
            token.UsedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        /// <summary>Burns any outstanding tokens for a user (e.g. after a successful reset).</summary>
        public async Task InvalidateAllForUserAsync(int userId)
        {
            var active = await _context.PasswordResetTokens
                .Where(t => t.UserId == userId && t.UsedAt == null)
                .ToListAsync();
            foreach (var t in active) t.UsedAt = DateTime.UtcNow;
            if (active.Count > 0) await _context.SaveChangesAsync();
        }
    }
}
