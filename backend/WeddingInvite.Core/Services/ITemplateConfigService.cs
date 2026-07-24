namespace WeddingInvite.Core.Services
{
    public interface ITemplateConfigService
    {
        Task<Dictionary<string, string>> GetConfigAsync(int weddingId);
        Task SaveConfigAsync(int weddingId, Dictionary<string, string> config, string role, string? tier);

        // ── Per-template starting-design defaults ──────────────────────────────────────────────
        /// <summary>The template's stored starting-design bag (empty when none is set).</summary>
        Task<Dictionary<string, string>> GetDefaultAsync(int templateId);

        /// <summary>Number of keys in the template's starting design — for admin status display.</summary>
        Task<int> GetDefaultKeyCountAsync(int templateId);

        /// <summary>
        /// Capture a finished invite's visual config as <paramref name="templateId"/>'s starting
        /// design, dropping couple-specific content keys. Replaces any existing default.
        /// </summary>
        Task SetDefaultFromWeddingAsync(int templateId, int weddingId);

        /// <summary>Clear the template's starting design (new invites fall back to code defaults).</summary>
        Task ClearDefaultAsync(int templateId);
    }
}
