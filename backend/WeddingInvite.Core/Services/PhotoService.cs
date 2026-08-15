using Microsoft.AspNetCore.Http;
using WeddingInvite.Core.Constants;
using WeddingInvite.Core.DTOs;
using WeddingInvite.Core.Utilities;
using WeddingInvite.Data.Repositories;
using WeddingInvite.Models;

namespace WeddingInvite.Core.Services
{
    public class PhotoService : IPhotoService
    {
        private readonly IPhotoRepository _photoRepo;
        private readonly IEventRepository _eventRepo;
        private readonly IEventFeatureRepository _eventFeatureRepo;
        private readonly ITemplateConfigService _templateConfigService;
        private const long MaxFileSizeBytes = 10 * 1024 * 1024; // 10MB
        private static readonly string[] AllowedExtensions = { ".jpg", ".jpeg", ".png", ".gif", ".webp" };

        public PhotoService(
            IPhotoRepository photoRepo,
            IEventRepository eventRepo,
            IEventFeatureRepository eventFeatureRepo,
            ITemplateConfigService templateConfigService)
        {
            _photoRepo = photoRepo;
            _eventRepo = eventRepo;
            _eventFeatureRepo = eventFeatureRepo;
            _templateConfigService = templateConfigService;
        }

        public async Task<PhotoDto?> GetByIdAsync(int id)
        {
            var photo = await _photoRepo.GetByIdAsync(id);
            return photo == null ? null : MapToDto(photo);
        }

        public async Task<IEnumerable<PhotoDto>> GetByEventIdAsync(int eventId)
        {
            var photos = await _photoRepo.GetByEventIdAsync(eventId);
            return photos.Select(MapToDto);
        }

        public async Task<IEnumerable<PhotoDto>> GetVisibleByEventIdAsync(int eventId)
        {
            var photos = await _photoRepo.GetVisibleByEventIdAsync(eventId);
            return photos.Select(MapToDto);
        }

        // NEW: Get approved photos
        public async Task<IEnumerable<PhotoDto>> GetApprovedByEventIdAsync(int eventId)
        {
            var photos = await _photoRepo.GetByEventIdAsync(eventId);
            return photos.Where(p => p.IsApproved && p.IsVisible).Select(MapToDto);
        }

        // NEW: Get pending photos
        public async Task<IEnumerable<PhotoDto>> GetPendingByEventIdAsync(int eventId)
        {
            var photos = await _photoRepo.GetByEventIdAsync(eventId);
            return photos.Where(p => !p.IsApproved).Select(MapToDto);
        }

        public async Task<PhotoDto> UploadAsync(int eventId, PhotoUploadDto uploadDto)
        {
            var isCouple = uploadDto.UploadedBy == PhotoUploaderRole.Couple;

            // 1. Check event exists
            var evt = await _eventRepo.GetByIdAsync(eventId);
            if (evt == null)
                throw new KeyNotFoundException($"Event with ID {eventId} not found");

            // 2. Guest uploads require PHOTO_BOOTH feature
            if (!isCouple)
            {
                var isPhotoBoothEnabled = await _eventFeatureRepo.IsFeatureEnabledAsync(eventId, FeatureCodes.PhotoBooth);
                if (!isPhotoBoothEnabled)
                    throw new InvalidOperationException("Photo Booth feature is not enabled for this event");

                if (string.IsNullOrWhiteSpace(uploadDto.GuestName))
                    throw new ArgumentException("Guest name is required");
            }

            // 3. Couple uploads require a valid slot
            if (isCouple && (uploadDto.TemplateSlot == null || !TemplateSlots.All.Contains(uploadDto.TemplateSlot.Value)))
                throw new ArgumentException("A valid template slot is required for couple uploads");

            // 4. Validate file
            var file = uploadDto.File;
            if (file == null || file.Length == 0)
                throw new ArgumentException("Photo file is required");

            if (file.Length > MaxFileSizeBytes)
                throw new ArgumentException($"File size cannot exceed {MaxFileSizeBytes / 1024 / 1024}MB");

            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!AllowedExtensions.Contains(extension))
                throw new ArgumentException($"Only {string.Join(", ", AllowedExtensions)} files are allowed");

            if (!file.ContentType.StartsWith("image/"))
                throw new ArgumentException("Only image files are allowed");

            // Content-Type and extension are client-controlled — verify the real bytes.
            if (!FileSignatureValidator.IsValidImage(file, extension))
                throw new ArgumentException("File content does not match a valid image format");

            // 5. For couple uploads: upsert (delete existing slot if any). LayerImage is exempt — a
            //    stage can hold many, so those uploads always insert a fresh row.
            if (isCouple && uploadDto.TemplateSlot.HasValue && uploadDto.TemplateSlot.Value != TemplateSlots.LayerImage)
            {
                var existing = await _photoRepo.GetByTemplateSlotAsync(eventId, uploadDto.TemplateSlot.Value);
                if (existing != null)
                {
                    if (File.Exists(existing.FilePath))
                        File.Delete(existing.FilePath);
                    await _photoRepo.DeleteAsync(existing.PhotoId);
                }
            }

            // 6. Save file
            var subFolder = isCouple ? "Couple" : "Guest";
            var uploadsFolder = Path.Combine("wwwroot", "uploads", eventId.ToString(), subFolder);
            Directory.CreateDirectory(uploadsFolder);

            var uniqueFileName = $"{Guid.NewGuid()}{extension}";
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // 7. Determine approval state (couple uploads always approved; guest uploads check config)
            var autoApprove = true;
            if (!isCouple)
            {
                var config = await _templateConfigService.GetConfigAsync(eventId);
                autoApprove = !config.TryGetValue("photobooth.autoApprove", out var val) || val != "false";
            }

            // 8. Create photo record
            var photo = new Photo
            {
                EventId = eventId,
                GuestName = isCouple ? null : uploadDto.GuestName!.Trim(),
                FileName = uniqueFileName,
                FilePath = filePath,
                FileSize = file.Length,
                ContentType = file.ContentType,
                Caption = uploadDto.Caption?.Trim(),
                UploadedBy = isCouple ? PhotoUploaderRole.Couple : PhotoUploaderRole.Guest,
                TemplateSlot = uploadDto.TemplateSlot,
                IsApproved = autoApprove,
                IsVisible = true,
                IsFeatured = false,
                CreatedDate = DateTime.UtcNow
            };

            var created = await _photoRepo.CreateAsync(photo);
            return MapToDto(created);
        }

        public async Task<PhotoDto> UploadPhotoAsync(int eventId, CreatePhotoDto createDto, IFormFile file)
        {
            var uploadDto = new PhotoUploadDto
            {
                GuestName = createDto.GuestName,
                Caption = createDto.Caption,
                File = file,
                UploadedBy = PhotoUploaderRole.Guest
            };
            return await UploadAsync(eventId, uploadDto);
        }

        public async Task<IEnumerable<PhotoDto>> GetCoupleMediaByEventIdAsync(int eventId)
        {
            var photos = await _photoRepo.GetCoupleMediaByEventIdAsync(eventId);
            return photos.Select(MapToDto);
        }

        // NEW: Approve/Reject photo
        public async Task<PhotoDto> ApproveAsync(int id, ApprovePhotoDto approveDto, int approvedByUserId)
        {
            var photo = await _photoRepo.GetByIdAsync(id);
            if (photo == null)
                throw new KeyNotFoundException($"Photo with ID {id} not found");

            photo.IsApproved = approveDto.IsApproved;
            photo.RejectionReason = approveDto.RejectionReason;
            photo.ApprovedDate = approveDto.IsApproved ? DateTime.UtcNow : null;
            photo.ApprovedByUserId = approveDto.IsApproved ? approvedByUserId : null;

            var updated = await _photoRepo.UpdateAsync(photo);
            return MapToDto(updated);
        }

        // NEW: Set featured
        public async Task<PhotoDto> SetFeaturedAsync(int id, bool isFeatured)
        {
            var photo = await _photoRepo.GetByIdAsync(id);
            if (photo == null)
                throw new KeyNotFoundException($"Photo with ID {id} not found");

            photo.IsFeatured = isFeatured;
            var updated = await _photoRepo.UpdateAsync(photo);
            return MapToDto(updated);
        }

        // ORIGINAL UPDATE METHOD
        public async Task<PhotoDto> UpdateAsync(int id, UpdatePhotoDto updateDto)
        {
            var photo = await _photoRepo.GetByIdAsync(id);
            if (photo == null)
                throw new KeyNotFoundException($"Photo with ID {id} not found");

            // Update fields
            photo.Caption = updateDto.Caption?.Trim() ?? string.Empty;
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

        public async Task<int> GetPhotoCountAsync(int eventId)
        {
            return await _photoRepo.GetPhotoCountAsync(eventId);
        }

        // HELPER METHOD - Dynamically generates PhotoUrl from FilePath
        private PhotoDto MapToDto(Photo photo)
        {
            // Convert file path to public URL
            var photoUrl = photo.FilePath
                .Replace("wwwroot", "")
                .Replace("\\", "/");

            return new PhotoDto
            {
                PhotoId = photo.PhotoId,
                EventId = photo.EventId,
                GuestName = photo.GuestName,
                PhotoUrl = photoUrl,
                Caption = photo.Caption,
                FileSize = photo.FileSize,
                ContentType = photo.ContentType,
                UploadedBy = photo.UploadedBy,
                TemplateSlot = photo.TemplateSlot,
                IsApproved = photo.IsApproved,
                IsVisible = photo.IsVisible,
                IsFeatured = photo.IsFeatured,
                RejectionReason = photo.RejectionReason,
                ApprovedDate = photo.ApprovedDate,
                CreatedDate = photo.CreatedDate
            };
        }
    }
}
