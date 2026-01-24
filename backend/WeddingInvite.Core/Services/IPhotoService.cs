using Microsoft.AspNetCore.Http;
using WeddingInvite.Core.DTOs;

namespace WeddingInvite.Core.Services
{
    public interface IPhotoService
    {
        Task<PhotoDto?> GetByIdAsync(int id);
        Task<IEnumerable<PhotoDto>> GetByWeddingIdAsync(int weddingId);
        Task<IEnumerable<PhotoDto>> GetVisibleByWeddingIdAsync(int weddingId);
        Task<PhotoDto> UploadPhotoAsync(int weddingId, CreatePhotoDto createDto, IFormFile file);
        Task<PhotoDto> UpdateAsync(int id, UpdatePhotoDto updateDto);
        Task<bool> DeleteAsync(int id);
        Task<int> GetPhotoCountAsync(int weddingId);
    }
}