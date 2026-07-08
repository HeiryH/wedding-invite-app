namespace WeddingInvite.Core.Constants
{
    /// <summary>
    /// Single source of truth for what each tier (FREE / PREMIUM / PRO) may use.
    /// Tier is still set manually by an admin (no billing), but it is now enforced
    /// server-side: a wedding cannot enable a feature or adopt a template above its tier.
    /// </summary>
    public static class TierEntitlements
    {
        public const string Free = "FREE";
        public const string Premium = "PREMIUM";
        public const string Pro = "PRO";

        private static readonly Dictionary<string, int> Ranks = new(StringComparer.OrdinalIgnoreCase)
        {
            [Free] = 0,
            [Premium] = 1,
            [Pro] = 2,
        };

        // Minimum tier rank required to enable each feature.
        private static readonly Dictionary<string, int> FeatureMinRank = new(StringComparer.OrdinalIgnoreCase)
        {
            [FeatureCodes.RSVP] = 0,
            [FeatureCodes.Wishes] = 0,
            [FeatureCodes.PhotoBooth] = 1,
            [FeatureCodes.Seating] = 1,
            [FeatureCodes.CustomDomain] = 2,
        };

        /// <summary>Numeric rank of a tier string; unknown/blank tiers rank as FREE (0).</summary>
        public static int Rank(string? tier) =>
            tier != null && Ranks.TryGetValue(tier, out var r) ? r : 0;

        /// <summary>True if a wedding on <paramref name="tier"/> may enable the given feature.</summary>
        public static bool AllowsFeature(string? tier, string featureCode)
        {
            // Unknown codes default to the base tier so a new feature is never locked out by accident.
            var min = FeatureMinRank.TryGetValue(featureCode, out var m) ? m : 0;
            return Rank(tier) >= min;
        }

        /// <summary>True if a user of <paramref name="userTier"/> may adopt a template of <paramref name="templateTier"/>.</summary>
        public static bool AllowsTemplateTier(string? userTier, string? templateTier) =>
            Rank(userTier) >= Rank(templateTier);
    }
}
