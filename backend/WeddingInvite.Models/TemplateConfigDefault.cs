namespace WeddingInvite.Models
{
    /// <summary>
    /// A per-template "starting design": the key/value config bag a new event is seeded with at
    /// creation. Mirrors <see cref="EventTemplateConfig"/> but is keyed by TemplateId, not
    /// EventId. Captured by a super-admin from a finished invite (couple-content keys excluded);
    /// applied live at read time by TemplateConfigService.GetConfigAsync (see EventTemplateConfig).
    /// </summary>
    public class TemplateConfigDefault
    {
        public int TemplateConfigDefaultId { get; set; }
        public int TemplateId { get; set; }
        public string ConfigKey { get; set; } = string.Empty;
        public string ConfigValue { get; set; } = string.Empty;
        public DateTime UpdatedDate { get; set; } = DateTime.UtcNow;

        public Template Template { get; set; } = null!;
    }
}
