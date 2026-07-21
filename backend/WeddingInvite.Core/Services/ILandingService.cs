using WeddingInvite.Core.DTOs;

namespace WeddingInvite.Core.Services
{
    public interface ILandingService
    {
        Task<LandingDto> GetAsync();
        Task SaveContentAsync(Dictionary<string, string> content);
        Task<LandingSectionDto> UpsertSectionAsync(UpsertLandingSectionDto dto);
        Task<LandingItemDto> CreateItemAsync(UpsertLandingItemDto dto);
        Task<LandingItemDto?> UpdateItemAsync(int id, UpsertLandingItemDto dto);
        Task<bool> DeleteItemAsync(int id);
    }
}
