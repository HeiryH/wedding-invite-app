namespace WeddingInvite.Models
{
    public class ItineraryItem
    {
        public int ItineraryItemId { get; set; }
        public int WeddingId { get; set; }
        public string Label { get; set; } = string.Empty;
        public string Detail { get; set; } = string.Empty;
        public int SortOrder { get; set; }

        public Wedding Wedding { get; set; } = null!;
    }
}
