using System.Text.RegularExpressions;
using WeddingInvite.Core.Constants;
using WeddingInvite.Models;

namespace WeddingInvite.Core.Config
{
    /// <summary>
    /// Write policy for the WeddingTemplateConfig key-value bag.
    ///
    /// Mirrors `adminOnly: true` and `minTier` in frontend/lib/templateConfigSchema.ts — the
    /// frontend only hides controls, this is what actually stops a caller from writing keys they
    /// shouldn't. Two gates: admin-only keys (role) and stage-layout keys (PRO tier). Prefer the
    /// prefix/pattern forms over enumerations so the TS and C# copies can't drift.
    /// </summary>
    public static class TemplateConfigPolicy
    {
        public const int MaxKeyLength = 100;
        public const int MaxValueLength = 4000;
        public const int MaxKeys = 400;

        // NB: section.order is deliberately NOT here — couples reorder their own sections via the
        // customize rail, and every save writes the key.
        private static readonly HashSet<string> AdminOnlyKeys = new(StringComparer.Ordinal)
        {
            "nav.invite", "nav.rsvp", "nav.wishes", "nav.photos",
            "nav.welcome", "nav.ceremony", "nav.walimah", "nav.itinerary",
            "scene.fog.color", "scene.environment",
        };

        // Couples author their own stage layouts (t7.layout.*) through the Adjust panel, so those
        // are NOT admin-only. No prefix is admin-gated today; the array stays so a future family of
        // admin keys has an obvious home.
        private static readonly string[] AdminOnlyPrefixes = System.Array.Empty<string>();

        // Keys that hold a *specific couple's* content rather than the template's visual design.
        // Excluded when capturing a template's starting design (SetDefaultFromWeddingAsync), so a new
        // invite is seeded with the layout/colours/scene but not the reference couple's wording or
        // uploaded music. A blacklist, so any future *visual* key is captured by default.
        private static readonly HashSet<string> CoupleContentKeys = new(StringComparer.Ordinal)
        {
            "invite.body", "walimah.body", "music.url",
        };

        private static readonly Regex KeyPattern = new(@"^[a-zA-Z0-9._-]+$", RegexOptions.Compiled);

        // Stage-layer layout keys: t5.layout.mobile.welcome, t7.layout.desktop.rsvp, … and authored
        // (data, not code) templates' ta12.layout.mobile.stage-1 — TemplateWrapper.tsx/customize
        // page use the `ta<id>` prefix for those so they can never collide with a hand-coded
        // template's own `t<id>` namespace. The Adjust panel is a PRO-tier feature, so writing any
        // of these requires PRO. Matches every template's layout namespace at once, so onboarding
        // T5/T6/… or a new authored template needs no change here.
        private static readonly Regex LayoutKeyPattern = new(@"^ta?\d+\.layout\.", RegexOptions.Compiled);

        public static bool IsAdminOnly(string key) =>
            AdminOnlyKeys.Contains(key) ||
            AdminOnlyPrefixes.Any(p => key.StartsWith(p, StringComparison.Ordinal));

        public static bool IsLayoutKey(string key) => LayoutKeyPattern.IsMatch(key);

        /// <summary>
        /// Whether a key holds couple-specific content (excluded from a captured template default).
        /// </summary>
        public static bool IsCoupleContent(string key) => CoupleContentKeys.Contains(key);

        /// <summary>
        /// Whether a caller of the given role + tier may write this key. Super admins bypass both
        /// gates. Admin-only keys need SUPER_ADMIN; stage-layout keys need PRO tier.
        /// </summary>
        public static bool CanWrite(string key, string role, string? tier)
        {
            if (role == UserRoles.SuperAdmin) return true;
            if (IsAdminOnly(key)) return false;
            if (IsLayoutKey(key) && TierEntitlements.Rank(tier) < TierEntitlements.Rank(TierEntitlements.Pro))
                return false;
            return true;
        }

        /// <summary>Rejects malformed keys/values before they reach the DB. Returns null when valid.</summary>
        public static string? Validate(Dictionary<string, string> config)
        {
            if (config.Count > MaxKeys)
                return $"Too many config keys ({config.Count}); the limit is {MaxKeys}.";

            foreach (var (key, value) in config)
            {
                if (key.Length > MaxKeyLength)
                    return $"Config key '{key[..Math.Min(key.Length, 40)]}…' exceeds {MaxKeyLength} characters.";
                if (!KeyPattern.IsMatch(key))
                    return $"Config key '{key}' contains characters outside [a-zA-Z0-9._-].";
                if ((value?.Length ?? 0) > MaxValueLength)
                    return $"Value for '{key}' exceeds {MaxValueLength} characters.";
            }

            return null;
        }
    }
}
