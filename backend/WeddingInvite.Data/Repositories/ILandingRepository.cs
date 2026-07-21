using WeddingInvite.Models;

namespace WeddingInvite.Data.Repositories
{
    public interface ILandingRepository
    {
        Task<List<LandingContentItem>> GetContentAsync();
        Task<List<LandingSection>> GetSectionsAsync();
        Task<List<LandingItem>> GetItemsAsync();

        /// <summary>Whole-bag upsert of scalar content: changed keys written, others left intact.</summary>
        Task SaveContentAsync(Dictionary<string, string> content);

        Task<LandingSection> UpsertSectionAsync(LandingSection section);
        Task<LandingItem> CreateItemAsync(LandingItem item);
        Task<LandingItem?> UpdateItemAsync(int id, LandingItem patch);
        Task<bool> DeleteItemAsync(int id);
    }
}
