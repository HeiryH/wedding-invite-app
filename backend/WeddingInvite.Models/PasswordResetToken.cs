namespace WeddingInvite.Models
{
    /// <summary>
    /// A single-use, time-limited password-reset grant. Only the SHA-256 hash of the token is
    /// stored; the raw token lives only in the emailed link.
    /// </summary>
    public class PasswordResetToken
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public User User { get; set; } = null!;
        public string TokenHash { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; }
        public DateTime? UsedAt { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
