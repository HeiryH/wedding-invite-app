namespace WeddingInvite.Models
{
    public class Wish
    {
        // Primary Key
        public int WishId { get; set; }
        
        // Foreign Key
        public int WeddingId { get; set; }
        
        // Wish content
        public string GuestName { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        
        // Timestamp
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
        
        // Navigation property
        public Wedding Wedding { get; set; } = null!;
    }
}