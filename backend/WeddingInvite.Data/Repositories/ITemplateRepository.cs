using WeddingInvite.Models;

namespace WeddingInvite.Data.Repositories
{
    public interface ITemplateRepository
    {
        Task<Template?> GetByIdAsync(int id);
        Task<Template?> GetByCodeAsync(string code);
        Task<IEnumerable<Template>> GetAllAsync();
        Task<IEnumerable<Template>> GetActiveAsync();
        Task<Template> CreateAsync(Template template);
        Task<Template> UpdateAsync(Template template);
        Task<bool> DeleteAsync(int id);
    }
}