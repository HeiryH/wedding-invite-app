namespace WeddingInvite.Models
{
    // Junction table - links Event to Feature with enabled status
    public class EventFeature
    {
        // Primary Key
        public int EventFeatureId { get; set; }

        // Foreign Keys
        public int EventId { get; set; }
        public int FeatureId { get; set; }

        // Feature state for this event
        public bool IsEnabled { get; set; } = false;

        // Feature configuration (JSON for flexibility)
        // e.g., {"maxPhotos": 100, "allowGuests": true}
        public string? Configuration { get; set; }

        public DateTime EnabledDate { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public Event Event { get; set; } = null!;
        public Feature Feature { get; set; } = null!;
    }
}
