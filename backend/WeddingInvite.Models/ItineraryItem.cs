namespace WeddingInvite.Models
{
    public class ItineraryItem
    {
        public int ItineraryItemId { get; set; }
        public int EventId { get; set; }
        public string Label { get; set; } = string.Empty;
        public string Detail { get; set; } = string.Empty;
        public int SortOrder { get; set; }

        public Event Event { get; set; } = null!;
    }
}
