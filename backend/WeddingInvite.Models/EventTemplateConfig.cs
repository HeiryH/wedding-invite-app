namespace WeddingInvite.Models
{
    public class EventTemplateConfig
    {
        public int EventTemplateConfigId { get; set; }
        public int EventId { get; set; }
        public string ConfigKey { get; set; } = string.Empty;
        public string ConfigValue { get; set; } = string.Empty;
        public DateTime UpdatedDate { get; set; } = DateTime.UtcNow;

        public Event Event { get; set; } = null!;
    }
}
