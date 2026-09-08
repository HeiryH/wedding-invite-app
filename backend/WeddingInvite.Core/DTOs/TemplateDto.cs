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
        public string Tier { get; set; } = "BASIC";
        public int SortOrder { get; set; }
        public bool IsAuthored { get; set; }
        // Only meaningful when IsAuthored — the Record<StageId,StageDef> JSON the authoring UI
        // reads back into its editor. Null for every hand-coded template.
        public string? StagesJson { get; set; }
        public string EventTypes { get; set; } = "WEDDING";
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
        public string Tier { get; set; } = "BASIC";
        public bool IsActive { get; set; }
        public int SortOrder { get; set; }
        public string EventTypes { get; set; } = "WEDDING";
    }

    // Body for POST /api/template — creates a brand-new authored (data, not code) template on a
    // blank canvas. TemplateCode is optional; a blank value is slugified from TemplateName.
    public class CreateTemplateDto
    {
        public string TemplateName { get; set; } = string.Empty;
        public string TemplateCode { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Tier { get; set; } = "BASIC";
    }
}