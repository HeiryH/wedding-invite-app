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
                SortOrder = template.SortOrder
            };
        }
    }
}