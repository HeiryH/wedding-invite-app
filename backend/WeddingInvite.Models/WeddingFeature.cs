namespace WeddingInvite.Models
{
    // Junction table - links Wedding to Feature with enabled status
    public class WeddingFeature
    {
        // Primary Key
        public int WeddingFeatureId { get; set; }
        
        // Foreign Keys
        public int WeddingId { get; set; }
        public int FeatureId { get; set; }
        
        // Feature state for this wedding
        public bool IsEnabled { get; set; } = false;
        
        // Feature configuration (JSON for flexibility)
        // e.g., {"maxPhotos": 100, "allowGuests": true}
        public string? Configuration { get; set; }
        
        public DateTime EnabledDate { get; set; } = DateTime.UtcNow;
        
        // Navigation properties
        public Wedding Wedding { get; set; } = null!;
        public Feature Feature { get; set; } = null!;
    }
}