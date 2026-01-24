namespace WeddingInvite.Core.DTOs
{
    // What the API sends to clients
    public class WeddingDto
    {
        public int WeddingId { get; set; }
        public string CoupleName { get; set; } = string.Empty;
        public string BrideName { get; set; } = string.Empty;
        public string GroomName { get; set; } = string.Empty;
        public DateTime WeddingDate { get; set; }
        public string Venue { get; set; } = string.Empty;
        public string VenueAddress { get; set; } = string.Empty;
        
        // Computed fields (not in database)
        public int TotalGuests { get; set; }
        public int TotalAttending { get; set; }
        public int DaysUntilWedding { get; set; }

        public int TotalPhotos { get; set; }
        public int EnabledFeaturesCount { get; set; }
    }
    
    // What clients send when creating a wedding
    public class CreateWeddingDto
    {
        public string CoupleName { get; set; } = string.Empty;
        public string BrideName { get; set; } = string.Empty;
        public string GroomName { get; set; } = string.Empty;
        public DateTime WeddingDate { get; set; }
        public string Venue { get; set; } = string.Empty;
        public string VenueAddress { get; set; } = string.Empty;
    }
    
    // What clients send when updating a wedding
    public class UpdateWeddingDto
    {
        public string CoupleName { get; set; } = string.Empty;
        public string BrideName { get; set; } = string.Empty;
        public string GroomName { get; set; } = string.Empty;
        public DateTime WeddingDate { get; set; }
        public string Venue { get; set; } = string.Empty;
        public string VenueAddress { get; set; } = string.Empty;
    }
}