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
        public int SortOrder { get; set; }
    }
}