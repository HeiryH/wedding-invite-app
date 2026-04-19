using WeddingInvite.Models;

namespace WeddingInvite.Data.Repositories
{
    public interface ITemplateConfigRepository
    {
        Task<IEnumerable<WeddingTemplateConfig>> GetByWeddingIdAsync(int weddingId);
        Task UpsertAsync(int weddingId, Dictionary<string, string> configs);
    }
}
