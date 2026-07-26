namespace WeddingInvite.Core.Constants
{
    /// <summary>
    /// Single source of truth for tier ordering (FREE / PREMIUM / PRO). Tier is still set
    /// manually by an admin (no billing). Which *features* each tier unlocks now lives in the
    /// Package/PackageFeature tables (see IPackageRepository.TierIncludesFeatureAsync) — the
    /// FREE/PREMIUM/PRO packages *are* the tier definitions, editable at /super-admin/packages.
    /// Template tier gating is unrelated and stays here (Template.Tier is its own field).
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

        /// <summary>Numeric rank of a tier string; unknown/blank tiers rank as FREE (0).</summary>
        public static int Rank(string? tier) =>
            tier != null && Ranks.TryGetValue(tier, out var r) ? r : 0;

        /// <summary>True if a user of <paramref name="userTier"/> may adopt a template of <paramref name="templateTier"/>.</summary>
        public static bool AllowsTemplateTier(string? userTier, string? templateTier) =>
            Rank(userTier) >= Rank(templateTier);
    }
}
