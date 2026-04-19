using WeddingInvite.Core.DTOs;

namespace WeddingInvite.Core.Services
{
    public interface ITableService
    {
        Task<TableDto?> GetByIdAsync(int id);
        Task<IEnumerable<TableDto>> GetByWeddingIdAsync(int weddingId);
        Task<TableDto> CreateAsync(CreateTableDto dto);
        Task<TableDto> UpdateAsync(int id, UpdateTableDto dto);
        Task<bool> DeleteAsync(int id);
        Task AssignGuestAsync(int tableId, int guestId);
        Task UnassignGuestAsync(int guestId);
    }
}
