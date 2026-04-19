namespace WeddingInvite.Core.DTOs
{
    public class GuestDto
    {
        public int GuestId { get; set; }
        public int WeddingId { get; set; }
        public string GuestName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string BrideOrGroomSide { get; set; } = string.Empty;
        public int NumberOfAttendees { get; set; }
        public string SongRequest { get; set; } = string.Empty;
        public bool IsAttending { get; set; }
        public DateTime? RespondedDate { get; set; }
        public int? TableId { get; set; }
        public string? TableName { get; set; }
    }
    
    // For updating an existing guest
    public class UpdateGuestDto
    {
        public string GuestName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string BrideOrGroomSide { get; set; } = string.Empty;
        public int NumberOfAttendees { get; set; } = 1;
        public string SongRequest { get; set; } = string.Empty;
        public bool IsAttending { get; set; } = true;
    }

    // For RSVP form submission
    public class CreateGuestDto
    {
        public int WeddingId { get; set; }
        public string GuestName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string BrideOrGroomSide { get; set; } = string.Empty; // "Bride" or "Groom"
        public int NumberOfAttendees { get; set; } = 1;
        public string SongRequest { get; set; } = string.Empty;
        public bool IsAttending { get; set; } = true;
        public int? TableId { get; set; }
    }
}