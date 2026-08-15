using Microsoft.AspNetCore.Http;
using WeddingInvite.Core.DTOs;

namespace WeddingInvite.Core.Services
{
    public interface IPhotoService
    {
        Task<PhotoDto> UploadAsync(int eventId, PhotoUploadDto uploadDto);
        Task<PhotoDto> UploadPhotoAsync(int eventId, CreatePhotoDto createDto, IFormFile file);
        Task<PhotoDto?> GetByIdAsync(int id);
        Task<IEnumerable<PhotoDto>> GetByEventIdAsync(int eventId);
        Task<IEnumerable<PhotoDto>> GetVisibleByEventIdAsync(int eventId);
        Task<IEnumerable<PhotoDto>> GetApprovedByEventIdAsync(int eventId);
        Task<IEnumerable<PhotoDto>> GetPendingByEventIdAsync(int eventId);
        Task<IEnumerable<PhotoDto>> GetCoupleMediaByEventIdAsync(int eventId);
        Task<PhotoDto> ApproveAsync(int id, ApprovePhotoDto approveDto, int approvedByUserId);
        Task<PhotoDto> SetFeaturedAsync(int id, bool isFeatured);
        Task<PhotoDto> UpdateAsync(int id, UpdatePhotoDto updateDto);
        Task<bool> DeleteAsync(int id);
        Task<int> GetPhotoCountAsync(int eventId);
    }
}
