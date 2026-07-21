using WeddingInvite.Core.Config;
using WeddingInvite.Data.Repositories;

namespace WeddingInvite.Core.Services
{
    public class TemplateConfigService : ITemplateConfigService
    {
        private readonly ITemplateConfigRepository _repo;

        public TemplateConfigService(ITemplateConfigRepository repo)
        {
            _repo = repo;
        }

        public async Task<Dictionary<string, string>> GetConfigAsync(int weddingId)
        {
            var records = await _repo.GetByWeddingIdAsync(weddingId);
            return records.ToDictionary(r => r.ConfigKey, r => r.ConfigValue);
        }

        public async Task SaveConfigAsync(int weddingId, Dictionary<string, string> config, string role, string? tier)
        {
            // Keys the caller may not write (admin-only for a couple, layout keys for sub-PRO) are
            // dropped rather than rejected: the customize page echoes back the whole config bag, so
            // refusing the request just because one forbidden key is present would break every save.
            // Dropping from the prune predicate too means those keys are preserved, not deleted.
            bool CanWrite(string key) => TemplateConfigPolicy.CanWrite(key, role, tier);

            var writable = config
                .Where(kv => CanWrite(kv.Key))
                .ToDictionary(kv => kv.Key, kv => kv.Value, StringComparer.Ordinal);

            await _repo.UpsertAsync(weddingId, writable, CanWrite);
        }
    }
}
