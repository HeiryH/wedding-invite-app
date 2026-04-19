namespace WeddingInvite.Models
{
    public class Photo
    {
        public int PhotoId { get; set; }
        public int WeddingId { get; set; }
        public string? GuestName { get; set; }
        public string FileName { get; set; } = string.Empty;
        public string FilePath { get; set; } = string.Empty;
        public string PhotoUrl { get; set; } = string.Empty;
        public string ContentType { get; set; } = string.Empty;
        public long FileSize { get; set; }
        public string? Caption { get; set; }

        // Who uploaded — "GUEST" (default) or "COUPLE"
        public string UploadedBy { get; set; } = PhotoUploaderRole.Guest;

        // For COUPLE uploads: ordered slot (1=Groom Portrait, 2=Bride Portrait, 3-5=Extra)
        public int? TemplateSlot { get; set; }

        // Moderation (applies to GUEST uploads only)
        public bool IsApproved { get; set; } = false;
        public bool IsVisible { get; set; } = true;
        public bool IsFeatured { get; set; } = false;
        public string? RejectionReason { get; set; }
        public DateTime? ApprovedDate { get; set; }
        public int? ApprovedByUserId { get; set; }

        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        // Navigation
        public Wedding Wedding { get; set; } = null!;
        public User? ApprovedBy { get; set; }
    }

    public static class PhotoUploaderRole
    {
        public const string Guest = "GUEST";
        public const string Couple = "COUPLE";
    }

    public static class TemplateSlots
    {
        public const int GroomPortrait = 1;
        public const int BridePortrait = 2;
        public const int Extra1 = 3;
        public const int Extra2 = 4;
        public const int Extra3 = 5;

        public static readonly int[] All = [GroomPortrait, BridePortrait, Extra1, Extra2, Extra3];
    }
}
