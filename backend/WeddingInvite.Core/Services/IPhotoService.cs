using Microsoft.AspNetCore.Http;
using WeddingInvite.Core.DTOs;

namespace WeddingInvite.Core.Services
{
    public interface IPhotoService
    {
        Task<PhotoDto> UploadAsync(int weddingId, PhotoUploadDto uploadDto);
        Task<PhotoDto> UploadPhotoAsync(int weddingId, CreatePhotoDto createDto, IFormFile file);
        Task<PhotoDto?> GetByIdAsync(int id);
        Task<IEnumerable<PhotoDto>> GetByWeddingIdAsync(int weddingId);
        Task<IEnumerable<PhotoDto>> GetVisibleByWeddingIdAsync(int weddingId);
        Task<IEnumerable<PhotoDto>> GetApprovedByWeddingIdAsync(int weddingId);
        Task<IEnumerable<PhotoDto>> GetPendingByWeddingIdAsync(int weddingId);
        Task<IEnumerable<PhotoDto>> GetCoupleMediaByWeddingIdAsync(int weddingId);
        Task<PhotoDto> ApproveAsync(int id, ApprovePhotoDto approveDto, int approvedByUserId);
        Task<PhotoDto> SetFeaturedAsync(int id, bool isFeatured);
        Task<PhotoDto> UpdateAsync(int id, UpdatePhotoDto updateDto);
        Task<bool> DeleteAsync(int id);
        Task<int> GetPhotoCountAsync(int weddingId);
    }
}