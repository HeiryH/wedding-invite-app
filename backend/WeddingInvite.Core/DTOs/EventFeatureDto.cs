namespace WeddingInvite.Core.DTOs
{
    public class EventFeatureDto
    {
        public int EventFeatureId { get; set; }
        public int EventId { get; set; }
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

    // Response DTO for event with features
    public class EventWithFeaturesDto
    {
        public EventDto Event { get; set; } = null!;
        public List<EventFeatureDto> Features { get; set; } = new();
    }
}
