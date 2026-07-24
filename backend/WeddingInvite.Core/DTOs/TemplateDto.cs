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
        public bool IsAuthored { get; set; }
    }

    public class TemplateUsageDto : TemplateDto
    {
        public int WeddingCount { get; set; }
    }

    // Body for PUT /api/template/{id}/stages — a raw JSON blob (frontend
    // Record<StageId, StageDef>), validated only as "is this well-formed JSON", not against the
    // frontend's shape (that stays a frontend-only contract for this slice).
    public class SetTemplateStagesDto
    {
        public string StagesJson { get; set; } = string.Empty;
    }

    public class UpdateTemplateMetaDto
    {
        public string TemplateName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Tier { get; set; } = "FREE";
        public bool IsActive { get; set; }
        public int SortOrder { get; set; }
    }
}