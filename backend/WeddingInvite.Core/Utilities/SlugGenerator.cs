using WeddingInvite.Models;

namespace WeddingInvite.Core.Utilities
{
    /// <summary>
    /// Single source of truth for generating an event's URL slug, type-aware across
    /// WEDDING/PARTY/CEREMONY (see <see cref="EventTypes"/>). Wired into both EventService.CreateAsync/
    /// UpdateAsync and AuthController.SelfRegister, replacing two independent, drifted
    /// implementations that used to produce different slug formats for the same two names
    /// ("{bride}-{groom}" vs. "{bride}-and-{groom}").
    /// </summary>
    public static class SlugGenerator
    {
        /// <summary>
        /// Builds the base slug (pre-uniqueness-suffixing) for the given event type and naming
        /// fields. Callers are responsible for the uniqueness retry loop (see
        /// AuthController.SelfRegister's "{baseSlug}-{n}" loop for the existing pattern) — this
        /// method only ever derives the "ideal" slug from the event's own data.
        /// </summary>
        public static string GenerateBaseSlug(string eventType, string? name1, string? name2, string? eventTitle)
        {
            return eventType switch
            {
                EventTypes.Wedding => $"{First(name1, "bride")}-{First(name2, "groom")}",
                EventTypes.Party => First(name1, "party"),
                EventTypes.Ceremony => SlugifyTitle(eventTitle, "ceremony"),
                _ => SlugifyTitle(eventTitle, "event"),
            };
        }

        /// <summary>First word of a name, lower-cased, letters/digits only; falls back if empty.</summary>
        private static string First(string? name, string fallback)
        {
            var word = (name ?? string.Empty).Trim().Split(' ')[0];
            var cleaned = new string(word.ToLowerInvariant().Where(char.IsLetterOrDigit).ToArray());
            return string.IsNullOrEmpty(cleaned) ? fallback : cleaned;
        }

        /// <summary>First 2-3 words of a title, hyphen-joined, letters/digits only.</summary>
        private static string SlugifyTitle(string? title, string fallback)
        {
            var words = (title ?? string.Empty)
                .Trim()
                .Split(' ', StringSplitOptions.RemoveEmptyEntries)
                .Take(3)
                .Select(w => new string(w.ToLowerInvariant().Where(char.IsLetterOrDigit).ToArray()))
                .Where(w => w.Length > 0)
                .ToArray();

            return words.Length > 0 ? string.Join("-", words) : fallback;
        }
    }
}
