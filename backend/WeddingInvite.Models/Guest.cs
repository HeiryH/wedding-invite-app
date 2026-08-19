namespace WeddingInvite.Models
{
    public class Guest
    {
        // Primary Key
        public int GuestId { get; set; }

        // Foreign Key - which event does this guest belong to?
        public int EventId { get; set; }

        // Guest information
        public string GuestName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;

        // RSVP details — which side of a WEDDING the guest belongs to. "PRIMARY" maps to Name1
        // ("Bride"), "SECONDARY" to Name2 ("Groom"). Not required/used for non-WEDDING events.
        public string? GuestSide { get; set; }
        public int NumberOfAttendees { get; set; } = 1;
        public string SongRequest { get; set; } = string.Empty;

        // RSVP status
        public bool IsAttending { get; set; } = true; // Assume yes until they say no
        public DateTime? RespondedDate { get; set; } // Nullable - might not have responded yet

        // Seating assignment (nullable - guest may not be assigned to a table)
        public int? TableId { get; set; }
        public Table? Table { get; set; }

        // Navigation property - back to Event
        public Event Event { get; set; } = null!;
    }
}
