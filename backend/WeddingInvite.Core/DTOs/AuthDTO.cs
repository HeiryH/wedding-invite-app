namespace WeddingInvite.Core.DTOs
{
    public class LoginDto
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class LoginResponseDto
    {
        public string Token { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public int? EventId { get; set; }
        public string Tier { get; set; } = "BASIC";
    }

    public class SetTierDto
    {
        public string Tier { get; set; } = string.Empty;
    }

    public class SelfRegisterDto
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        // WEDDING: both required. PARTY: Name1 only. CEREMONY: EventTitle only. See
        // EventNaming.HasRequiredNaming, the single source of truth for this validation
        // (mirrored here rather than reused directly since self-register builds its own Event).
        public string? Name1 { get; set; }
        public string? Name2 { get; set; }
        public string? EventTitle { get; set; }
        // Defaults to WEDDING server-side (AuthController.SelfRegister) if not sent, so any
        // caller that predates event-type selection keeps working unchanged.
        public string? EventType { get; set; }
        public string EventDate { get; set; } = string.Empty;
        public string Venue { get; set; } = string.Empty;
        public string VenueAddress { get; set; } = string.Empty;
        public int TemplateId { get; set; } = 1;

        // Optional guest-personalised content carried through from the public
        // Personalise draft, so the new account is populated with their work.
        public Dictionary<string, string>? Config { get; set; }
        public List<SelfRegisterItineraryDto>? Itinerary { get; set; }
    }

    public class SelfRegisterItineraryDto
    {
        public string Label { get; set; } = string.Empty;
        public string Detail { get; set; } = string.Empty;
        public int SortOrder { get; set; }
    }

    public class RegisterCoupleDto
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public int EventId { get; set; }
    }

    public class CreateOrganizerAdminDto
    {
        public int EventId { get; set; }
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class SetActiveDto
    {
        public bool IsActive { get; set; }
    }

    public class ResetPasswordDto
    {
        public string NewPassword { get; set; } = string.Empty;
    }

    public class ForgotPasswordDto
    {
        public string Email { get; set; } = string.Empty;
    }

    public class ResetPasswordWithTokenDto
    {
        public string Token { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
    }

    public class CreateHostAdminDto
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }
}