namespace WeddingInvite.Core.DTOs
{
    public class ItineraryItemDto
    {
        public int ItineraryItemId { get; set; }
        public int WeddingId { get; set; }
        public string Label { get; set; } = string.Empty;
        public string Detail { get; set; } = string.Empty;
        public int SortOrder { get; set; }
    }

    public class CreateItineraryItemDto
    {
        public string Label { get; set; } = string.Empty;
        public string Detail { get; set; } = string.Empty;
        public int SortOrder { get; set; }
    }

    public class UpdateItineraryItemDto
    {
        public string Label { get; set; } = string.Empty;
        public string Detail { get; set; } = string.Empty;
        public int SortOrder { get; set; }
    }

    public class ReorderItineraryDto
    {
        public List<ReorderItem> Items { get; set; } = new();
    }

    public class ReorderItem
    {
        public int ItineraryItemId { get; set; }
        public int SortOrder { get; set; }
    }
}
