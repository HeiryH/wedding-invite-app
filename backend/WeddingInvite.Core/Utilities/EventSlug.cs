using System.Text.RegularExpressions;

namespace WeddingInvite.Core.Utilities
{
    /// <summary>
    /// The one place that decides what an event's public-URL slug may look like.
    ///
    /// The slug is chosen by whoever creates the event — the create form proposes one from the
    /// names, but it's an ordinary editable field — so it arrives as free text and must be folded
    /// to its canonical form *before* it is either stored or compared. Normalising before the
    /// uniqueness check is the load-bearing part: slugs are stored lower-cased, so checking the
    /// raw input let "John-And-Mary" clear a collision check against a stored "john-and-mary" and
    /// then save on top of it.
    ///
    /// Normalisation is deliberately only case and whitespace. Anything else invalid is
    /// **rejected, not silently rewritten** — quietly turning a posted "ali/siti" into "alisiti"
    /// would hand the caller a URL they never asked for. The friendly folding of spaces and
    /// punctuation belongs in the form (frontend/lib/slug.ts), where the admin can see the result
    /// before saving.
    /// </summary>
    public static class EventSlug
    {
        public const int MinLength = 3;
        public const int MaxLength = 60;

        // No leading or trailing hyphen, and no "--" run: those read as typos in a shared link,
        // and they let two near-identical URLs exist side by side.
        private static readonly Regex Shape = new(@"^[a-z0-9]+(-[a-z0-9]+)*$", RegexOptions.Compiled);

        /// <summary>Folds free text into the canonical form actually stored and served.</summary>
        public static string Normalize(string? raw) => (raw ?? string.Empty).Trim().ToLowerInvariant();

        /// <summary>
        /// Validates an ALREADY-normalised slug, explaining the failure in the words the create
        /// form shows the admin. Returns null when the slug is fine.
        /// </summary>
        public static string? Validate(string normalized)
        {
            if (string.IsNullOrEmpty(normalized))
                return "A URL is required.";
            if (normalized.Length < MinLength)
                return $"A URL needs at least {MinLength} characters.";
            if (normalized.Length > MaxLength)
                return $"A URL can be at most {MaxLength} characters.";
            if (!Shape.IsMatch(normalized))
                return "A URL can only contain letters, numbers and single hyphens between them.";
            return null;
        }
    }
}
