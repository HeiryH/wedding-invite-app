namespace WeddingInvite.Models
{
    public class Feature
    {
        // Primary Key
        public int FeatureId { get; set; }
        
        // Feature details
        public string FeatureCode { get; set; } = string.Empty; // e.g., "PHOTO_BOOTH"
        public string FeatureName { get; set; } = string.Empty; // e.g., "Photo Booth"
        public string Description { get; set; } = string.Empty;
        
        // Feature metadata
        public bool IsPremium { get; set; } = false; // Is this a paid feature?
        public bool IsActive { get; set; } = true; // Can be enabled at all?
        public int SortOrder { get; set; } = 0; // Display order
        
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
        
        // Navigation property
        public ICollection<WeddingFeature> WeddingFeatures { get; set; } = new List<WeddingFeature>();
    }
}