using WeddingInvite.Core.DTOs;
using WeddingInvite.Data.Repositories;
using WeddingInvite.Models;

namespace WeddingInvite.Core.Services
{
    public class TemplateService : ITemplateService
    {
        private readonly ITemplateRepository _templateRepo;
        
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
                SortOrder = template.SortOrder
            };
        }
    }
}