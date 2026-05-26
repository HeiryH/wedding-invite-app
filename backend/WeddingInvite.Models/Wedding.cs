namespace WeddingInvite.Models
{
    public class Wedding
    {
        // Primary Key - auto-incremented by database
        public int WeddingId { get; set; }

        // Unique slug for URL (e.g., "john-and-mary")
        public string CoupleName { get; set; } = string.Empty;

        // Bride and Groom names
        public string BrideName { get; set; } = string.Empty;
        public string GroomName { get; set; } = string.Empty;

        // Wedding details
        public DateTime WeddingDate { get; set; }
        public string Venue { get; set; } = string.Empty;
        public string VenueAddress { get; set; } = string.Empty;

        public int TemplateId { get; set; } = 1; // Default to template 1
        public Template Template { get; set; } = null!;

        public int? PackageId { get; set; }
        public Package? Package { get; set; }

        // Status
        public bool IsActive { get; set; } = true;
        public int MaxPax { get; set; } = 0;          // 0 = no limit (per-RSVP entry cap)
        public int MaxCapacity { get; set; } = 0;     // 0 = no limit (total wedding capacity)
        public bool ShowCapacityWarning { get; set; } = false;
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        // Navigation properties - related data
        // One wedding has many guests
        public ICollection<Guest> Guests { get; set; } = new List<Guest>();

        // One wedding has many wishes
        public ICollection<Wish> Wishes { get; set; } = new List<Wish>();

        public ICollection<WeddingFeature> WeddingFeatures { get; set; } = new List<WeddingFeature>();
        public ICollection<Photo> Photos { get; set; } = new List<Photo>();
        public ICollection<ItineraryItem> ItineraryItems { get; set; } = new List<ItineraryItem>();

    }
}