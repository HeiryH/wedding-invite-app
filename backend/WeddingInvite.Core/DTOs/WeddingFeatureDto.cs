namespace WeddingInvite.Core.DTOs
{
    public class WeddingFeatureDto
    {
        public int WeddingFeatureId { get; set; }
        public int WeddingId { get; set; }
        public int FeatureId { get; set; }
        public string FeatureCode { get; set; } = string.Empty;
        public string FeatureName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public bool IsEnabled { get; set; }
        public bool IsPremium { get; set; }
        public string? Configuration { get; set; }
        public DateTime EnabledDate { get; set; }
    }
    
    public class ToggleFeatureDto
    {
        public int FeatureId { get; set; }
        public bool IsEnabled { get; set; }
        public string? Configuration { get; set; }
    }
    
    // Response DTO for wedding with features
    public class WeddingWithFeaturesDto
    {
        public WeddingDto Wedding { get; set; } = null!;
        public List<WeddingFeatureDto> Features { get; set; } = new();
    }
}