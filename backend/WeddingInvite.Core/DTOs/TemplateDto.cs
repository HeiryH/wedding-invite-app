namespace WeddingInvite.Core.DTOs
{
    public class TemplateDto
    {
        public int TemplateId { get; set; }
        public string TemplateName { get; set; } = string.Empty;
        public string TemplateCode { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string ThumbnailUrl { get; set; } = string.Empty;
        public string PrimaryColor { get; set; } = string.Empty;
        public string SecondaryColor { get; set; } = string.Empty;
        public string ComponentPath { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public bool IsPremium { get; set; }
        public string Tier { get; set; } = "FREE";
        public int SortOrder { get; set; }
        public string EventTypes { get; set; } = "WEDDING";
    }

    public class TemplateUsageDto : TemplateDto
    {
        public int WeddingCount { get; set; }
    }

    public class UpdateTemplateMetaDto
    {
        public string TemplateName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Tier { get; set; } = "FREE";
        public bool IsActive { get; set; }
        public int SortOrder { get; set; }
        public string EventTypes { get; set; } = "WEDDING";
    }
}