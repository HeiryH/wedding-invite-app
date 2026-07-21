namespace WeddingInvite.Core.DTOs
{
    /// <summary>The whole composed landing payload the public page renders from.</summary>
    public class LandingDto
    {
        public Dictionary<string, string> Content { get; set; } = new();
        public List<LandingSectionDto> Sections { get; set; } = new();
        public List<LandingItemDto> Items { get; set; } = new();
    }

    public class LandingSectionDto
    {
        public int Id { get; set; }
        public string SectionKey { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public int SortOrder { get; set; }
        public bool IsVisible { get; set; } = true;
    }

    public class LandingItemDto
    {
        public int Id { get; set; }
        public string SectionKey { get; set; } = string.Empty;
        public int SortOrder { get; set; }
        public bool IsActive { get; set; } = true;
        public string Title { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;
        public string Meta { get; set; } = string.Empty;
    }

    // ── Write DTOs ────────────────────────────────────────────────────────────
    public class SaveLandingContentDto
    {
        public Dictionary<string, string> Content { get; set; } = new();
    }

    public class UpsertLandingSectionDto
    {
        public string SectionKey { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public int SortOrder { get; set; }
        public bool IsVisible { get; set; } = true;
    }

    public class UpsertLandingItemDto
    {
        public string SectionKey { get; set; } = string.Empty;
        public int SortOrder { get; set; }
        public bool IsActive { get; set; } = true;
        public string Title { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;
        public string Meta { get; set; } = string.Empty;
    }
}
