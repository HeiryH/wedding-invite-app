namespace WeddingInvite.Models
{
    public class WeddingTemplateConfig
    {
        public int WeddingTemplateConfigId { get; set; }
        public int WeddingId { get; set; }
        public string ConfigKey { get; set; } = string.Empty;
        public string ConfigValue { get; set; } = string.Empty;
        public DateTime UpdatedDate { get; set; } = DateTime.UtcNow;

        public Wedding Wedding { get; set; } = null!;
    }
}
