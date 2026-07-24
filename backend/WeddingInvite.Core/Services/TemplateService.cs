using System.Text.Json;
using Microsoft.AspNetCore.Http;
using WeddingInvite.Core.DTOs;
using WeddingInvite.Core.Utilities;
using WeddingInvite.Data.Repositories;
using WeddingInvite.Models;

namespace WeddingInvite.Core.Services
{
    public class TemplateService : ITemplateService
    {
        private readonly ITemplateRepository _templateRepo;
        private const long MaxThumbnailBytes = 10 * 1024 * 1024; // 10MB, mirrors PhotoService
        private static readonly string[] AllowedExtensions = { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
        private const int MaxStagesJsonLength = 200_000; // a multi-stage composition, not a single config value

        public TemplateService(ITemplateRepository templateRepo)
        {
            _templateRepo = templateRepo;
        }
        
        public async Task<TemplateDto?> GetByIdAsync(int id)
        {
            var template = await _templateRepo.GetByIdAsync(id);
            if (template == null) return null;
            
            return MapToDto(template);
        }
        
        public async Task<TemplateDto?> GetByCodeAsync(string code)
        {
            var template = await _templateRepo.GetByCodeAsync(code);
            if (template == null) return null;
            
            return MapToDto(template);
        }
        
        public async Task<IEnumerable<TemplateDto>> GetAllAsync()
        {
            var templates = await _templateRepo.GetAllAsync();
            return templates.Select(MapToDto);
        }
        
        public async Task<IEnumerable<TemplateDto>> GetActiveAsync()
        {
            var templates = await _templateRepo.GetActiveAsync();
            return templates.Select(MapToDto);
        }

        public async Task<IEnumerable<TemplateUsageDto>> GetAllWithUsageAsync()
        {
            var templates = await _templateRepo.GetAllAsync();
            var counts = await _templateRepo.GetWeddingCountsByTemplateAsync();

            return templates
                .Select(t => new TemplateUsageDto
                {
                    TemplateId = t.TemplateId,
                    TemplateName = t.TemplateName,
                    TemplateCode = t.TemplateCode,
                    Description = t.Description,
                    ThumbnailUrl = t.ThumbnailUrl,
                    PrimaryColor = t.PrimaryColor,
                    SecondaryColor = t.SecondaryColor,
                    ComponentPath = t.ComponentPath,
                    IsActive = t.IsActive,
                    IsPremium = t.IsPremium,
                    Tier = t.Tier,
                    SortOrder = t.SortOrder,
                    WeddingCount = counts.TryGetValue(t.TemplateId, out var c) ? c : 0
                })
                // Active first, then most-used, then sort order
                .OrderByDescending(t => t.IsActive)
                .ThenByDescending(t => t.WeddingCount)
                .ThenBy(t => t.SortOrder)
                .ToList();
        }

        public async Task<TemplateDto> UpdateAsync(int id, UpdateTemplateMetaDto updateDto)
        {
            var template = await _templateRepo.GetByIdAsync(id);
            if (template == null)
                throw new KeyNotFoundException($"Template with ID {id} not found");

            template.TemplateName = updateDto.TemplateName.Trim();
            template.Description = updateDto.Description.Trim();
            template.Tier = updateDto.Tier.ToUpper().Trim();
            template.IsPremium = template.Tier != "FREE"; // keep boolean in sync with tier
            template.IsActive = updateDto.IsActive;
            template.SortOrder = updateDto.SortOrder;

            var updated = await _templateRepo.UpdateAsync(template);
            return MapToDto(updated);
        }

        public async Task<TemplateDto> SetThumbnailAsync(int id, IFormFile file)
        {
            var template = await _templateRepo.GetByIdAsync(id);
            if (template == null)
                throw new KeyNotFoundException($"Template with ID {id} not found");

            if (file == null || file.Length == 0)
                throw new ArgumentException("Thumbnail file is required");
            if (file.Length > MaxThumbnailBytes)
                throw new ArgumentException($"File size cannot exceed {MaxThumbnailBytes / 1024 / 1024}MB");

            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!AllowedExtensions.Contains(extension))
                throw new ArgumentException($"Only {string.Join(", ", AllowedExtensions)} files are allowed");
            if (!file.ContentType.StartsWith("image/"))
                throw new ArgumentException("Only image files are allowed");
            if (!FileSignatureValidator.IsValidImage(file, extension))
                throw new ArgumentException("File content does not match a valid image format");

            // Persisted under wwwroot/uploads (backed by the same Docker volume as wedding photo
            // uploads), NOT frontend/public/template-previews — that directory is static, baked
            // into the frontend image at build time, and any runtime write to it would be lost on
            // the next deploy. TemplatePreview.tsx prefers this thumbnailUrl when set.
            var uploadsFolder = Path.Combine("wwwroot", "uploads", "templates");
            Directory.CreateDirectory(uploadsFolder);

            var uniqueFileName = $"{template.TemplateCode}-{Guid.NewGuid()}{extension}";
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Clean up the previous upload, but only if it's one of ours — ThumbnailUrl could
            // point elsewhere (or be empty/the unused legacy default) and must never be deleted.
            if (!string.IsNullOrWhiteSpace(template.ThumbnailUrl) && template.ThumbnailUrl.StartsWith("/uploads/templates/"))
            {
                var oldPath = Path.Combine("wwwroot", template.ThumbnailUrl.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));
                if (File.Exists(oldPath))
                    File.Delete(oldPath);
            }

            template.ThumbnailUrl = $"/uploads/templates/{uniqueFileName}";
            var updated = await _templateRepo.UpdateAsync(template);
            return MapToDto(updated);
        }

        public async Task<TemplateDto> SetStagesAsync(int id, string stagesJson)
        {
            var template = await _templateRepo.GetByIdAsync(id);
            if (template == null)
                throw new KeyNotFoundException($"Template with ID {id} not found");

            if (string.IsNullOrWhiteSpace(stagesJson))
                throw new ArgumentException("stagesJson is required");
            if (stagesJson.Length > MaxStagesJsonLength)
                throw new ArgumentException($"stagesJson cannot exceed {MaxStagesJsonLength} characters");
            try
            {
                JsonDocument.Parse(stagesJson);
            }
            catch (JsonException)
            {
                throw new ArgumentException("stagesJson is not valid JSON");
            }

            template.StagesJson = stagesJson;
            template.IsAuthored = true;
            var updated = await _templateRepo.UpdateAsync(template);
            return MapToDto(updated);
        }

        public async Task<TemplateDto> ClearStagesAsync(int id)
        {
            var template = await _templateRepo.GetByIdAsync(id);
            if (template == null)
                throw new KeyNotFoundException($"Template with ID {id} not found");

            template.StagesJson = null;
            template.IsAuthored = false;
            var updated = await _templateRepo.UpdateAsync(template);
            return MapToDto(updated);
        }

        private TemplateDto MapToDto(Template template)
        {
            return new TemplateDto
            {
                TemplateId = template.TemplateId,
                TemplateName = template.TemplateName,
                TemplateCode = template.TemplateCode,
                Description = template.Description,
                ThumbnailUrl = template.ThumbnailUrl,
                PrimaryColor = template.PrimaryColor,
                SecondaryColor = template.SecondaryColor,
                ComponentPath = template.ComponentPath,
                IsActive = template.IsActive,
                IsPremium = template.IsPremium,
                Tier = template.Tier,
                SortOrder = template.SortOrder,
                IsAuthored = template.IsAuthored
            };
        }
    }
}