namespace WeddingInvite.Core.DTOs
{
    // What the API sends to clients
    public class EventDto
    {
        public int EventId { get; set; }
        public string Slug { get; set; } = string.Empty;
        public string EventType { get; set; } = string.Empty;
        public string? Name1 { get; set; }
        public string? Name2 { get; set; }
        public string? EventTitle { get; set; }
        // Computed, type-aware display name (see Utilities.EventNaming.GetDisplayName)
        public string DisplayName { get; set; } = string.Empty;
        public DateTime EventDate { get; set; }
        public string Venue { get; set; } = string.Empty;
        public string VenueAddress { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public bool IsRsvpOpen { get; set; }
        public bool IsPublic { get; set; }

        // Computed fields (not in database)
        public int TotalGuests { get; set; }
        public int TotalAttending { get; set; }
        public int DaysUntilEvent { get; set; }
        public int TotalPhotos { get; set; }
        public int EnabledFeaturesCount { get; set; }
        public int TemplateId { get; set; }
        public string? TemplateName { get; set; }
        public string? TemplateCode { get; set; }
        public int MaxPax { get; set; }
        public int MaxCapacity { get; set; }
        public bool ShowCapacityWarning { get; set; }
        public int? CreatedByUserId { get; set; }
        public string? CreatedByEmail { get; set; }
        public string? Domain { get; set; }
        // The couple admin's tier (FREE|PREMIUM|PRO) — governs feature availability for this event.
        public string OwnerTier { get; set; } = "FREE";
    }

    // What clients send when creating an event
    public class CreateEventDto
    {
        public string Slug { get; set; } = string.Empty;
        public string EventType { get; set; } = string.Empty;
        public string? Name1 { get; set; }
        public string? Name2 { get; set; }
        public string? EventTitle { get; set; }
        public DateTime EventDate { get; set; }
        public string Venue { get; set; } = string.Empty;
        public string VenueAddress { get; set; } = string.Empty;
        public int TemplateId { get; set; }
    }

    // What clients send when updating an event. EventType is immutable after creation — changing
    // it would orphan the template/config choice.
    public class UpdateEventDto
    {
        public string? Name1 { get; set; }
        public string? Name2 { get; set; }
        public string? EventTitle { get; set; }
        public DateTime EventDate { get; set; }
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

    public class ToggleRsvpDto
    {
        public bool IsRsvpOpen { get; set; }
    }

    // Set (or clear, when null/empty) an event's custom domain. PRO tier only.
    public class SetDomainDto
    {
        public string? Domain { get; set; }
    }

}
