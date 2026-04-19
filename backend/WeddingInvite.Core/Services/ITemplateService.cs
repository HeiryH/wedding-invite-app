using WeddingInvite.Core.DTOs;

namespace WeddingInvite.Core.Services
{
    public interface ITemplateService
    {
        Task<TemplateDto?> GetByIdAsync(int id);
        Task<TemplateDto?> GetByCodeAsync(string code);
        Task<IEnumerable<TemplateDto>> GetAllAsync();
        Task<IEnumerable<TemplateDto>> GetActiveAsync();
    }
}