namespace WeddingInvite.Models
{
    public class User
    {
        public int UserId { get; set; }
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty; // "SUPER_ADMIN" or "ORGANIZER_ADMIN"
        public int? EventId { get; set; } // NULL for super admin
        public bool IsActive { get; set; } = true;
        public string Tier { get; set; } = "BASIC"; // BASIC | PREMIUM | PRO
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        // Navigation
        public Event? Event { get; set; }
    }

    // Role constants
    public static class UserRoles
    {
        public const string SuperAdmin = "SUPER_ADMIN";
        public const string HostAdmin = "HOST_ADMIN";
        public const string OrganizerAdmin = "ORGANIZER_ADMIN";
    }
}
