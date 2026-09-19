namespace WeddingInvite.Core.Services
{
    /// <summary>
    /// Moves a template's *design* (not its code) between environments as a zip bundle:
    /// the captured starting design (TemplateConfigDefaults), an authored template's StagesJson,
    /// the thumbnail, and every /uploads/… asset those reference. Built so a theme tuned on a
    /// local machine can be imported into production instead of re-doing the Adjust work there.
    /// Templates are matched by <c>TemplateCode</c>, never by id — ids differ across databases.
    /// </summary>
    public interface ITemplateDesignService
    {
        /// <summary>Bundle the given templates (all templates when <paramref name="templateIds"/> is empty).</summary>
        Task<byte[]> ExportAsync(IReadOnlyCollection<int> templateIds);

        /// <summary>
        /// Apply a bundle. Each entry replaces the matching template's starting design, StagesJson
        /// and thumbnail; <paramref name="applyMeta"/> additionally copies name/description/tier/
        /// event types. Templates whose code doesn't exist here are reported, not created.
        /// </summary>
        Task<TemplateDesignImportResult> ImportAsync(Stream bundle, bool applyMeta);
    }

    public class TemplateDesignImportResult
    {
        public List<TemplateDesignImportEntry> Applied { get; set; } = new();
        public List<string> Skipped { get; set; } = new();
    }

    public class TemplateDesignImportEntry
    {
        public int TemplateId { get; set; }
        public string TemplateCode { get; set; } = string.Empty;
        public int DefaultKeyCount { get; set; }
        public bool StagesApplied { get; set; }
        public bool ThumbnailApplied { get; set; }
        public int AssetsWritten { get; set; }
    }
}
