namespace WeddingInvite.Core.Utilities
{
    /// <summary>
    /// Shared gate: does a template (its <c>Template.EventTypes</c> CSV tag) support a given
    /// event type? Mirrors TemplateService.NormalizeEventTypes' parsing approach — comma-separated,
    /// upper-cased, trimmed codes. Used by both EventService.CreateAsync/UpdateTemplateAsync and
    /// AuthController.SelfRegister — the latter builds its own Event outside EventService (so it
    /// can keep self-registered events private-by-default) but needs the exact same check, hence
    /// this shared helper instead of two independently-maintained copies.
    /// </summary>
    public static class TemplateEventGate
    {
        public static bool Supports(string templateEventTypes, string eventType)
        {
            var supported = (templateEventTypes ?? string.Empty)
                .Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries)
                .Select(s => s.ToUpperInvariant());
            return supported.Contains(eventType);
        }
    }
}
