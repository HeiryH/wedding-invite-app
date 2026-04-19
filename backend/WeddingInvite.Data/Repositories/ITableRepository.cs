using WeddingInvite.Models;

namespace WeddingInvite.Data.Repositories
{
    public interface ITableRepository
    {
        Task<Table?> GetByIdAsync(int id);
        Task<IEnumerable<Table>> GetByWeddingIdAsync(int weddingId);
        Task<Table> CreateAsync(Table table);
        Task<Table> UpdateAsync(Table table);
        Task<bool> DeleteAsync(int id);
    }
}
