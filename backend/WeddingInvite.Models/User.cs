namespace WeddingInvite.Models
{
    public class User
    {
        public int UserId { get; set; }
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty; // "SUPER_ADMIN" or "COUPLE_ADMIN"
        public int? WeddingId { get; set; } // NULL for super admin
        public bool IsActive { get; set; } = true;
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
        
        // Navigation
        public Wedding? Wedding { get; set; }
    }
    
    // Role constants
    public static class UserRoles
    {
        public const string SuperAdmin = "SUPER_ADMIN";
        public const string CoupleAdmin = "COUPLE_ADMIN";
    }
}