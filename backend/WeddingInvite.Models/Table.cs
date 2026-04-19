namespace WeddingInvite.Models
{
    public class Table
    {
        public int TableId { get; set; }
        public int WeddingId { get; set; }
        public string TableName { get; set; } = string.Empty;
        public int Capacity { get; set; }
        public int SortOrder { get; set; }

        public Wedding Wedding { get; set; } = null!;
        public ICollection<Guest> Guests { get; set; } = new List<Guest>();
    }
}
