using WeddingInvite.Models;

namespace WeddingInvite.Data.Repositories
{
    public interface IPhotoRepository
    {
        Task<Photo?> GetByIdAsync(int id);
        Task<IEnumerable<Photo>> GetByEventIdAsync(int eventId);
        Task<IEnumerable<Photo>> GetVisibleByEventIdAsync(int eventId);
        Task<IEnumerable<Photo>> GetCoupleMediaByEventIdAsync(int eventId);
        /// <summary>Every photo for an event regardless of uploader — for the event export.</summary>
        Task<IEnumerable<Photo>> GetAllByEventIdAsync(int eventId);
        Task<Photo?> GetByTemplateSlotAsync(int eventId, int templateSlot);
        Task<Photo> CreateAsync(Photo photo);
        Task<Photo> UpdateAsync(Photo photo);
        Task<bool> DeleteAsync(int id);
        Task<int> GetPhotoCountAsync(int eventId);
    }
}
