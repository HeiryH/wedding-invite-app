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
        public int? WeddingId { get; set; }
        public string Tier { get; set; } = "FREE";
    }

    public class SetTierDto
    {
        public string Tier { get; set; } = string.Empty;
    }

    public class SelfRegisterDto
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string BrideName { get; set; } = string.Empty;
        public string GroomName { get; set; } = string.Empty;
        public string WeddingDate { get; set; } = string.Empty;
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
        public int WeddingId { get; set; }
    }

    public class CreateCoupleAdminDto
    {
        public int WeddingId { get; set; }
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