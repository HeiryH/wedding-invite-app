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

    public class CreateHostAdminDto
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }
}