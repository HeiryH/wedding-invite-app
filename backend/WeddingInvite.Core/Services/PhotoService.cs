using Microsoft.AspNetCore.Http;
using WeddingInvite.Core.DTOs;
using WeddingInvite.Data.Repositories;
using WeddingInvite.Models;

namespace WeddingInvite.Core.Services
{
    public class PhotoService : IPhotoService
    {
        private readonly IPhotoRepository _photoRepo;
        private readonly IWeddingRepository _weddingRepo;
        private readonly IWeddingFeatureRepository _weddingFeatureRepo;
        private const long MaxFileSizeBytes = 10 * 1024 * 1024; // 10MB
        private static readonly string[] AllowedExtensions = { ".jpg", ".jpeg", ".png", ".gif" };
        
        public PhotoService(
            IPhotoRepository photoRepo,
            IWeddingRepository weddingRepo,
            IWeddingFeatureRepository weddingFeatureRepo)
        {
            _photoRepo = photoRepo;
            _weddingRepo = weddingRepo;
            _weddingFeatureRepo = weddingFeatureRepo;
        }
        
        public async Task<PhotoDto?> GetByIdAsync(int id)
        {
            var photo = await _photoRepo.GetByIdAsync(id);
            if (photo == null) return null;
            
            return MapToDto(photo);
        }
        
        public async Task<IEnumerable<PhotoDto>> GetByWeddingIdAsync(int weddingId)
        {
            var photos = await _photoRepo.GetByWeddingIdAsync(weddingId);
            return photos.Select(MapToDto);
        }
        
        public async Task<IEnumerable<PhotoDto>> GetVisibleByWeddingIdAsync(int weddingId)
        {
            var photos = await _photoRepo.GetVisibleByWeddingIdAsync(weddingId);
            return photos.Select(MapToDto);
        }
        
        public async Task<PhotoDto> UploadPhotoAsync(int weddingId, CreatePhotoDto createDto, IFormFile file)
        {
            // BUSINESS VALIDATION
            
            // 1. Check if wedding exists
            var wedding = await _weddingRepo.GetByIdAsync(weddingId);
            if (wedding == null)
                throw new KeyNotFoundException($"Wedding with ID {weddingId} not found");
            
            // 2. Check if Photo Booth feature is enabled
            var isPhotoBoothEnabled = await _weddingFeatureRepo.IsFeatureEnabledAsync(
                weddingId, 
                "PHOTO_BOOTH"
            );
            if (!isPhotoBoothEnabled)
                throw new InvalidOperationException("Photo Booth feature is not enabled for this wedding");
            
            // 3. Validate guest name
            if (string.IsNullOrWhiteSpace(createDto.GuestName))
                throw new ArgumentException("Guest name is required");
            
            // 4. Validate file
            if (file == null || file.Length == 0)
                throw new ArgumentException("Photo file is required");
            
            // 5. Check file size
            if (file.Length > MaxFileSizeBytes)
                throw new ArgumentException($"File size cannot exceed {MaxFileSizeBytes / 1024 / 1024}MB");
            
            // 6. Check file extension
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!AllowedExtensions.Contains(extension))
                throw new ArgumentException($"Only {string.Join(", ", AllowedExtensions)} files are allowed");
            
            // 7. Check content type
            if (!file.ContentType.StartsWith("image/"))
                throw new ArgumentException("Only image files are allowed");
            
            // SAVE FILE
            var uploadsFolder = Path.Combine("wwwroot", "uploads", "photos", weddingId.ToString());
            Directory.CreateDirectory(uploadsFolder);
            
            var uniqueFileName = $"{Guid.NewGuid()}{extension}";
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);
            
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }
            
            // CREATE PHOTO RECORD
            var photo = new Photo
            {
                WeddingId = weddingId,
                GuestName = createDto.GuestName.Trim(),
                FileName = file.FileName,
                FilePath = filePath,
                FileSize = file.Length,
                ContentType = file.ContentType,
                Caption = createDto.Caption.Trim(),
                IsApproved = true, // Auto-approve for now
                IsVisible = true,
                UploadedDate = DateTime.UtcNow
            };
            
            var created = await _photoRepo.CreateAsync(photo);
            return MapToDto(created);
        }
        
        public async Task<PhotoDto> UpdateAsync(int id, UpdatePhotoDto updateDto)
        {
            var photo = await _photoRepo.GetByIdAsync(id);
            if (photo == null)
                throw new KeyNotFoundException($"Photo with ID {id} not found");
            
            // Update fields
            photo.Caption = updateDto.Caption.Trim();
            photo.IsApproved = updateDto.IsApproved;
            photo.IsVisible = updateDto.IsVisible;
            
            var updated = await _photoRepo.UpdateAsync(photo);
            return MapToDto(updated);
        }
        
        public async Task<bool> DeleteAsync(int id)
        {
            var photo = await _photoRepo.GetByIdAsync(id);
            if (photo == null) return false;
            
            // Delete file from disk
            if (File.Exists(photo.FilePath))
            {
                File.Delete(photo.FilePath);
            }
            
            // Delete from database
            return await _photoRepo.DeleteAsync(id);
        }
        
        public async Task<int> GetPhotoCountAsync(int weddingId)
        {
            return await _photoRepo.GetPhotoCountAsync(weddingId);
        }
        
        // HELPER METHOD
        private PhotoDto MapToDto(Photo photo)
        {
            // Convert file path to public URL
            var photoUrl = photo.FilePath
                .Replace("wwwroot", "")
                .Replace("\\", "/");
            
            return new PhotoDto
            {
                PhotoId = photo.PhotoId,
                WeddingId = photo.WeddingId,
                GuestName = photo.GuestName,
                FileName = photo.FileName,
                PhotoUrl = photoUrl,
                FileSize = photo.FileSize,
                Caption = photo.Caption,
                IsApproved = photo.IsApproved,
                IsVisible = photo.IsVisible,
                UploadedDate = photo.UploadedDate
            };
        }
    }
}