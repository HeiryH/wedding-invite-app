namespace WeddingInvite.Models
{
    public class Template
    {
        // Primary Key
        public int TemplateId { get; set; }
        
        // Template details
        public string TemplateName { get; set; } = string.Empty; // "Classic Rose", "Golden Elegance"
        public string TemplateCode { get; set; } = string.Empty; // "classic-rose", "golden-elegance"
        public string Description { get; set; } = string.Empty;
        public string ThumbnailUrl { get; set; } = string.Empty; // Preview image
        
        // Template metadata
        public string PrimaryColor { get; set; } = string.Empty; // "#f43f5e" (rose-500)
        public string SecondaryColor { get; set; } = string.Empty; // "#ec4899" (pink-500)
        public string ComponentPath { get; set; } = string.Empty; // "Template1", "Template2"
        
        // Status
        public bool IsActive { get; set; } = true;
        public bool IsPremium { get; set; } = false;
        public int SortOrder { get; set; } = 0;
        
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
        
        // Navigation property
        public ICollection<Wedding> Weddings { get; set; } = new List<Wedding>();
    }
}