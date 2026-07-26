using WeddingInvite.Core.Config;
using WeddingInvite.Data.Repositories;

namespace WeddingInvite.Core.Services
{
    public class TemplateConfigService : ITemplateConfigService
    {
        private readonly ITemplateConfigRepository _repo;
        private readonly ITemplateConfigDefaultRepository _defaultRepo;
        private readonly IWeddingRepository _weddingRepo;

        public TemplateConfigService(
            ITemplateConfigRepository repo,
            ITemplateConfigDefaultRepository defaultRepo,
            IWeddingRepository weddingRepo)
        {
            _repo = repo;
            _defaultRepo = defaultRepo;
            _weddingRepo = weddingRepo;
        }

        /// <summary>
        /// The effective config for a wedding: the template's captured "starting design" **underlaid**
        /// by the wedding's own rows (a stored key always wins). So every invite of a template renders
        /// that template's default for any key the couple hasn't personally overridden — and improving
        /// the default propagates live to those keys, with no re-seeding. A template with no captured
        /// default contributes nothing, so this is identical to returning the raw rows.
        /// </summary>
        public async Task<Dictionary<string, string>> GetConfigAsync(int weddingId)
        {
            var result = await GetTemplateDefaultForWeddingAsync(weddingId); // underlay (may be empty)

            var records = await _repo.GetByWeddingIdAsync(weddingId);
            foreach (var r in records) result[r.ConfigKey] = r.ConfigValue;  // the couple's overrides win

            return result;
        }

        public async Task SaveConfigAsync(int weddingId, Dictionary<string, string> config, string role, string? tier)
        {
            // Keys the caller may not write (admin-only for a couple, layout keys for sub-PRO) are
            // dropped rather than rejected: the customize page echoes back the whole config bag, so
            // refusing the request just because one forbidden key is present would break every save.
            // Dropping from the prune predicate too means those keys are preserved, not deleted.
            bool CanWrite(string key) => TemplateConfigPolicy.CanWrite(key, role, tier);

            // Store only *true overrides*. A submitted value equal to the template default is not
            // persisted — it falls back to the default via GetConfigAsync, so the invite keeps tracking
            // the default. That's also how "reset a stage" reverts to the theme's starting design: the
            // reset value matches the default (or the key is omitted), so no row is kept. Passing the
            // overrides (not the raw bag) to UpsertAsync means any writable stored key that now equals
            // the default — whether omitted or resubmitted-as-default — is pruned back to the default.
            var defaults = await GetTemplateDefaultForWeddingAsync(weddingId);

            var overrides = config
                .Where(kv => CanWrite(kv.Key))
                .Where(kv => !(defaults.TryGetValue(kv.Key, out var d) && d == kv.Value))
                .ToDictionary(kv => kv.Key, kv => kv.Value, StringComparer.Ordinal);

            await _repo.UpsertAsync(weddingId, overrides, CanWrite);
        }

        public Task<Dictionary<string, string>> GetDefaultAsync(int templateId) =>
            _defaultRepo.GetByTemplateIdAsync(templateId);

        public Task<int> GetDefaultKeyCountAsync(int templateId) =>
            _defaultRepo.CountAsync(templateId);

        public async Task SetDefaultFromWeddingAsync(int templateId, int weddingId)
        {
            // Capture the source invite's *effective* config (GetConfigAsync already merges in whatever
            // default it currently inherits), minus this couple's own content (rich-text bodies,
            // uploaded music). Everything else — layout, colours, scene, titles, order — is the design.
            var config = await GetConfigAsync(weddingId);

            var design = config
                .Where(kv => !TemplateConfigPolicy.IsCoupleContent(kv.Key))
                .ToDictionary(kv => kv.Key, kv => kv.Value, StringComparer.Ordinal);

            await _defaultRepo.ReplaceAsync(templateId, design);
        }

        public Task ClearDefaultAsync(int templateId) =>
            _defaultRepo.ReplaceAsync(templateId, new Dictionary<string, string>());

        /// <summary>The captured default for a wedding's current template (empty if none / no wedding).</summary>
        private async Task<Dictionary<string, string>> GetTemplateDefaultForWeddingAsync(int weddingId)
        {
            var wedding = await _weddingRepo.GetByIdAsync(weddingId);
            if (wedding == null) return new Dictionary<string, string>(StringComparer.Ordinal);
            return await _defaultRepo.GetByTemplateIdAsync(wedding.TemplateId);
        }
    }
}
