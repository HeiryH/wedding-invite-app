namespace WeddingInvite.Core.DTOs
{
    public class FeatureDto
    {
        public int FeatureId { get; set; }
        public string FeatureCode { get; set; } = string.Empty;
        public string FeatureName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public bool IsPremium { get; set; }
        public bool IsActive { get; set; }
        public int SortOrder { get; set; }
    }
    
    public class CreateFeatureDto
    {
        public string FeatureCode { get; set; } = string.Empty;
        public string FeatureName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public bool IsPremium { get; set; }
        public int SortOrder { get; set; }
    }
    
    public class UpdateFeatureDto
    {
        public string FeatureName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public bool IsPremium { get; set; }
        public bool IsActive { get; set; }
        public int SortOrder { get; set; }
    }
}