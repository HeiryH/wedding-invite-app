namespace WeddingInvite.Models
{
    public class Guest
    {
        // Primary Key
        public int GuestId { get; set; }
        
        // Foreign Key - which wedding does this guest belong to?
        public int WeddingId { get; set; }
        
        // Guest information
        public string GuestName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        
        // RSVP details (from your requirements)
        public string BrideOrGroomSide { get; set; } = string.Empty; // "Bride" or "Groom"
        public int NumberOfAttendees { get; set; } = 1;
        public string SongRequest { get; set; } = string.Empty;
        
        // RSVP status
        public bool IsAttending { get; set; } = true; // Assume yes until they say no
        public DateTime? RespondedDate { get; set; } // Nullable - might not have responded yet
        
        // Seating assignment (nullable - guest may not be assigned to a table)
        public int? TableId { get; set; }
        public Table? Table { get; set; }

        // Navigation property - back to Wedding
        public Wedding Wedding { get; set; } = null!;
    }
}