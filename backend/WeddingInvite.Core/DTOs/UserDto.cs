namespace WeddingInvite.Core.DTOs
{
    public class UserDto
    {
        public int UserId { get; set; }
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public int? EventId { get; set; }
        public bool IsActive { get; set; }
        public string Tier { get; set; } = "BASIC";
        public DateTime CreatedDate { get; set; }
    }
}