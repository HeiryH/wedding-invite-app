namespace WeddingInvite.Models
{
    /// <summary>Scalar site-wide landing content (hero text, tagline, stats…), keyed by a stable string.</summary>
    public class LandingContentItem
    {
        public int Id { get; set; }
        public string ContentKey { get; set; } = string.Empty;
        public string ContentValue { get; set; } = string.Empty;
    }

    /// <summary>A landing section — controls its display order and visibility on the public page.</summary>
    public class LandingSection
    {
        public int Id { get; set; }
        public string SectionKey { get; set; } = string.Empty; // hero | features | pricing | stories | about | footer
        public string Title { get; set; } = string.Empty;
        public int SortOrder { get; set; }
        public bool IsVisible { get; set; } = true;
    }

    /// <summary>A repeatable row within a section (a feature, a testimonial, a gallery image…).</summary>
    public class LandingItem
    {
        public int Id { get; set; }
        public string SectionKey { get; set; } = string.Empty;
        public int SortOrder { get; set; }
        public bool IsActive { get; set; } = true;
        public string Title { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;
        public string Meta { get; set; } = string.Empty; // free-form (e.g. a colour swatch, an attribution)
    }
}
