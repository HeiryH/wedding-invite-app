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

        // Templates 1-7 are seeded, never created here. This is exclusively how a super-admin
        // starts a brand-new authored (data, not code) template — see _shared/DataTemplate.tsx.
        public async Task<TemplateDto> CreateAsync(CreateTemplateDto createDto)
        {
            var name = createDto.TemplateName.Trim();
            if (string.IsNullOrWhiteSpace(name))
                throw new ArgumentException("Template name is required");

            var code = Slugify(string.IsNullOrWhiteSpace(createDto.TemplateCode) ? name : createDto.TemplateCode);
            if (string.IsNullOrWhiteSpace(code))
                throw new ArgumentException("Template code is required");

            var existing = await _templateRepo.GetByCodeAsync(code);
            if (existing != null)
                throw new ArgumentException($"Template code '{code}' is already in use");

            var tier = createDto.Tier.ToUpper().Trim();
            if (tier != "FREE" && tier != "PREMIUM" && tier != "PRO")
                throw new ArgumentException("Tier must be FREE, PREMIUM, or PRO");

            var template = new Template
            {
                TemplateName = name,
                TemplateCode = code,
                Description = createDto.Description.Trim(),
                Tier = tier,
                IsPremium = tier != "FREE",
                IsActive = false, // draft until the author publishes it via the existing Update endpoint
                IsAuthored = true,
                StagesJson = DefaultStagesJson,
                SortOrder = 999,
            };

            var created = await _templateRepo.CreateAsync(template);
            return MapToDto(created);
        }

        // A single starter stage so the authoring UI has something to render/add layers into
        // immediately. Stage id is deliberately non-numeric — see the frontend authoring flatten
        // helper's note on object-key ordering.
        private const string DefaultStagesJson =
            "{\"stage-1\":{\"id\":\"stage-1\",\"label\":\"Stage 1\",\"bg\":\"\",\"bgFit\":\"cover\",\"layers\":[]}}";

        private static string Slugify(string input)
        {
            var lowered = input.Trim().ToLowerInvariant();
            var sb = new System.Text.StringBuilder();
            var lastDash = false;
            foreach (var c in lowered)
            {
                if (char.IsLetterOrDigit(c)) { sb.Append(c); lastDash = false; }
                else if (!lastDash) { sb.Append('-'); lastDash = true; }
            }
            return sb.ToString().Trim('-');
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

        // A wedding-less image upload for the authoring UI (stage backgrounds / layer images while
        // building a template that has no real wedding attached yet). PhotoService requires a real
        // Wedding row, so this reuses the thumbnail's validation + wwwroot/uploads/templates
        // storage instead, without mutating ThumbnailUrl.
        public async Task<string> UploadAssetAsync(int id, IFormFile file)
        {
            var template = await _templateRepo.GetByIdAsync(id);
            if (template == null)
                throw new KeyNotFoundException($"Template with ID {id} not found");

            if (file == null || file.Length == 0)
                throw new ArgumentException("File is required");
            if (file.Length > MaxThumbnailBytes)
                throw new ArgumentException($"File size cannot exceed {MaxThumbnailBytes / 1024 / 1024}MB");

            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!AllowedExtensions.Contains(extension))
                throw new ArgumentException($"Only {string.Join(", ", AllowedExtensions)} files are allowed");
            if (!file.ContentType.StartsWith("image/"))
                throw new ArgumentException("Only image files are allowed");
            if (!FileSignatureValidator.IsValidImage(file, extension))
                throw new ArgumentException("File content does not match a valid image format");

            var uploadsFolder = Path.Combine("wwwroot", "uploads", "templates");
            Directory.CreateDirectory(uploadsFolder);

            var uniqueFileName = $"{template.TemplateCode}-asset-{Guid.NewGuid()}{extension}";
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            return $"/uploads/templates/{uniqueFileName}";
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
                IsAuthored = template.IsAuthored,
                StagesJson = template.StagesJson
            };
        }
    }
}