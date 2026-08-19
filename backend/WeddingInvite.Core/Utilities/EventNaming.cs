using WeddingInvite.Models;

namespace WeddingInvite.Core.Utilities
{
    /// <summary>
    /// Single source of truth for turning an event's raw naming fields (two nullable names +
    /// an optional title) into the canonical display title, type-aware across
    /// WEDDING/PARTY/CEREMONY (see <see cref="EventTypes"/>). Wired into EventService.MapToDto
    /// (EventDto.DisplayName) so OG metadata, CSV export filenames, and admin list views share one
    /// branch instead of each reinventing "bride &amp; groom" vs. "name" vs. "title" logic independently.
    /// </summary>
    public static class EventNaming
    {
        public static string GetDisplayName(string eventType, string? name1, string? name2, string? eventTitle)
        {
            return eventType switch
            {
                EventTypes.Wedding when !string.IsNullOrWhiteSpace(name1) && !string.IsNullOrWhiteSpace(name2)
                    => $"{name1} & {name2}",
                EventTypes.Party when !string.IsNullOrWhiteSpace(name1)
                    => name1!,
                EventTypes.Ceremony when !string.IsNullOrWhiteSpace(eventTitle)
                    => eventTitle!,
                _ when !string.IsNullOrWhiteSpace(eventTitle) => eventTitle!,
                _ => "Event Invitation",
            };
        }

        /// <summary>
        /// True if the given naming fields satisfy the event type's requirement (WEDDING needs
        /// both names; PARTY needs name1; CEREMONY needs a title). Used by EventService.CreateAsync.
        /// </summary>
        public static bool HasRequiredNaming(string eventType, string? name1, string? name2, string? eventTitle)
        {
            return eventType switch
            {
                EventTypes.Wedding => !string.IsNullOrWhiteSpace(name1) && !string.IsNullOrWhiteSpace(name2),
                EventTypes.Party => !string.IsNullOrWhiteSpace(name1),
                EventTypes.Ceremony => !string.IsNullOrWhiteSpace(eventTitle),
                _ => false,
            };
        }
    }
}
