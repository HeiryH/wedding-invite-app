namespace WeddingInvite.Models
{
    public class Table
    {
        public int TableId { get; set; }
        public int EventId { get; set; }
        public string TableName { get; set; } = string.Empty;
        public int Capacity { get; set; }
        public int SortOrder { get; set; }

        public Event Event { get; set; } = null!;
        public ICollection<Guest> Guests { get; set; } = new List<Guest>();
    }
}
