namespace WeddingInvite.Models
{
    public class Photo
    {
        // Primary Key
        public int PhotoId { get; set; }
        
        // Foreign Key
        public int WeddingId { get; set; }
        
        // Photo metadata
        public string GuestName { get; set; } = string.Empty; // Who uploaded
        public string FileName { get; set; } = string.Empty; // Original filename
        public string FilePath { get; set; } = string.Empty; // Server path or cloud URL
        public long FileSize { get; set; } // Bytes
        public string ContentType { get; set; } = string.Empty; // e.g., "image/jpeg"
        
        // Optional caption
        public string Caption { get; set; } = string.Empty;
        
        // Moderation (for later - prevent inappropriate photos)
        public bool IsApproved { get; set; } = true; // Auto-approve by default
        public bool IsVisible { get; set; } = true; // Can hide without deleting
        
        public DateTime UploadedDate { get; set; } = DateTime.UtcNow;
        
        // Navigation property
        public Wedding Wedding { get; set; } = null!;
    }
}