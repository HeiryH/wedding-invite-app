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
        public bool IsActive { get; set; }

        // Computed fields (not in database)
        public int TotalGuests { get; set; }
        public int TotalAttending { get; set; }
        public int DaysUntilWedding { get; set; }
        public int TotalPhotos { get; set; }
        public int EnabledFeaturesCount { get; set; }
        public int TemplateId { get; set; }
        public string? TemplateName { get; set; }
        public string? TemplateCode { get; set; }
        public int? PackageId { get; set; }
        public string? PackageName { get; set; }
        public int MaxPax { get; set; }
        public int MaxCapacity { get; set; }
        public bool ShowCapacityWarning { get; set; }
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
        public int TemplateId { get; set; }
        public int? PackageId { get; set; }
    }

    // What clients send when updating a wedding
    public class UpdateWeddingDto
    {
        // public string CoupleName { get; set; } = string.Empty;
        public string BrideName { get; set; } = string.Empty;
        public string GroomName { get; set; } = string.Empty;
        public DateTime WeddingDate { get; set; }
        public string Venue { get; set; } = string.Empty;
        public string VenueAddress { get; set; } = string.Empty;
        // public int TemplateId { get; set; }
        public int MaxPax { get; set; } = 0;
        public int MaxCapacity { get; set; } = 0;
        public bool ShowCapacityWarning { get; set; } = false;
    }

    public class UpdateTemplateDto
    {
        public int TemplateId { get; set; }
    }

    public class ToggleActiveDto
    {
        public bool IsActive { get; set; }
    }

}