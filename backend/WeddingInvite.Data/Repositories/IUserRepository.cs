using WeddingInvite.Models;

namespace WeddingInvite.Data.Repositories
{
    public interface IUserRepository
    {
        Task<User?> GetByIdAsync(int id);
        Task<User?> GetByEmailAsync(string email);
        Task<User?> GetByEventIdAsync(int eventId);
        Task<User> CreateAsync(User user);
        Task<User> UpdateAsync(User user);
        Task<bool> DeleteAsync(int id);
        Task<IEnumerable<User>> GetAllByRoleAsync(string role);
    }
}