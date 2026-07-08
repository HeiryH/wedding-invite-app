namespace WeddingInvite.Core.Constants
{
    public static class FeatureCodes
    {
        // Live, toggleable features (seeded + surfaced in the per-wedding feature UI).
        public const string RSVP        = "RSVP";
        public const string Wishes      = "WISHES";
        public const string PhotoBooth  = "PHOTO_BOOTH";
        public const string Seating     = "SEATING";

        // Reserved for the PRO tier — activated in the Custom Domain work (roadmap Step 4).
        public const string CustomDomain = "CUSTOM_DOMAIN";

        // NOTE: GALLERY and COUNTDOWN were removed — neither was ever a real toggle.
        // The public "gallery" is the PHOTO_BOOTH grid, and the countdown is a
        // config-driven template section, not a gated feature.
    }
}