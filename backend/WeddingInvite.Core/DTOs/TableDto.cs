namespace WeddingInvite.Core.DTOs
{
    public class TableGuestDto
    {
        public int GuestId { get; set; }
        public string GuestName { get; set; } = string.Empty;
        public int NumberOfAttendees { get; set; }
    }

    public class TableDto
    {
        public int TableId { get; set; }
        public int WeddingId { get; set; }
        public string TableName { get; set; } = string.Empty;
        public int Capacity { get; set; }
        public int SortOrder { get; set; }
        public int GuestCount { get; set; }
        public List<TableGuestDto> Guests { get; set; } = new();
    }

    public class CreateTableDto
    {
        public int WeddingId { get; set; }
        public string TableName { get; set; } = string.Empty;
        public int Capacity { get; set; } = 8;
        public int SortOrder { get; set; }
    }

    public class UpdateTableDto
    {
        public string TableName { get; set; } = string.Empty;
        public int Capacity { get; set; }
        public int SortOrder { get; set; }
    }

    public class AssignGuestTableDto
    {
        public int? TableId { get; set; } // null to unassign
    }
}
