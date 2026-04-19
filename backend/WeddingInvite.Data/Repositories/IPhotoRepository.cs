using WeddingInvite.Models;

namespace WeddingInvite.Data.Repositories
{
    public interface IPhotoRepository
    {
        Task<Photo?> GetByIdAsync(int id);
        Task<IEnumerable<Photo>> GetByWeddingIdAsync(int weddingId);
        Task<IEnumerable<Photo>> GetVisibleByWeddingIdAsync(int weddingId);
        Task<IEnumerable<Photo>> GetCoupleMediaByWeddingIdAsync(int weddingId);
        Task<Photo?> GetByTemplateSlotAsync(int weddingId, int templateSlot);
        Task<Photo> CreateAsync(Photo photo);
        Task<Photo> UpdateAsync(Photo photo);
        Task<bool> DeleteAsync(int id);
        Task<int> GetPhotoCountAsync(int weddingId);
    }
}