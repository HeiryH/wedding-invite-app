using WeddingInvite.Models;

namespace WeddingInvite.Data.Repositories
{
    public interface ITemplateConfigRepository
    {
        Task<IEnumerable<EventTemplateConfig>> GetByEventIdAsync(int eventId);

        /// <param name="canPrune">
        /// Stored keys the caller is allowed to write. Any such key absent from <paramref name="configs"/>
        /// is deleted; keys outside this set are never touched.
        /// </param>
        Task UpsertAsync(int eventId, Dictionary<string, string> configs, Func<string, bool> canPrune);
    }
}
