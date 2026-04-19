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

        public async Task SaveConfigAsync(int weddingId, Dictionary<string, string> config)
        {
            await _repo.UpsertAsync(weddingId, config);
        }
    }
}
