namespace WeddingInvite.Models
{
    // The event categories a Template can be tagged with (Template.EventTypes, CSV).
    // Used by the public personalise picker to filter which templates show under
    // each event tab.
    public static class EventTypes
    {
        public const string Wedding = "WEDDING";
        public const string Ceremony = "CEREMONY";
        public const string Party = "PARTY";

        public static readonly string[] All = { Wedding, Ceremony, Party };
    }
}
