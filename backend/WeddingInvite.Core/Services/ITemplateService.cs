using Microsoft.AspNetCore.Http;
using WeddingInvite.Core.DTOs;

namespace WeddingInvite.Core.Services
{
    public interface ITemplateService
    {
        Task<TemplateDto?> GetByIdAsync(int id);
        Task<TemplateDto?> GetByCodeAsync(string code);
        Task<IEnumerable<TemplateDto>> GetAllAsync();
        Task<IEnumerable<TemplateDto>> GetActiveAsync();
        Task<IEnumerable<TemplateUsageDto>> GetAllWithUsageAsync();
        Task<TemplateDto> UpdateAsync(int id, UpdateTemplateMetaDto updateDto);
        Task<TemplateDto> CreateAsync(CreateTemplateDto createDto);
        Task<TemplateDto> SetThumbnailAsync(int id, IFormFile file);
        Task<string> UploadAssetAsync(int id, IFormFile file);
        Task<TemplateDto> SetStagesAsync(int id, string stagesJson);
        Task<TemplateDto> ClearStagesAsync(int id);
    }
}