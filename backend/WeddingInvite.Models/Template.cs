namespace WeddingInvite.Models
{
    public class Template
    {
        public int TemplateId { get; set; }
        public string Name { get; set; } = string.Empty; // e.g., "Midnight Elegance"
        public string TemplateCode { get; set; } = string.Empty; // e.g., "THEME_DARK_01"
        public string ThumbnailUrl { get; set; } = string.Empty;
        public bool IsPremium { get; set; }
        public bool IsActive { get; set; } = true;
    }
}