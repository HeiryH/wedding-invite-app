using Microsoft.EntityFrameworkCore;
using WeddingInvite.Models;

namespace WeddingInvite.Data.Repositories
{
    public class UserRepository : IUserRepository
    {
        private readonly AppDbContext _context;
        
        public UserRepository(AppDbContext context)
        {
            _context = context;
        }
        
        public async Task<User?> GetByIdAsync(int id)
        {
            return await _context.Users
                .Include(u => u.Wedding)
                .FirstOrDefaultAsync(u => u.UserId == id);
        }
        
        public async Task<User?> GetByEmailAsync(string email)
        {
            return await _context.Users
                .Include(u => u.Wedding)
                .FirstOrDefaultAsync(u => u.Email == email);
        }
        
        public async Task<User?> GetByWeddingIdAsync(int weddingId)
        {
            return await _context.Users
                .FirstOrDefaultAsync(u => u.WeddingId == weddingId && u.Role == "COUPLE_ADMIN");
        }

        public async Task<User> CreateAsync(User user)
        {
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            return user;
        }
        
        public async Task<User> UpdateAsync(User user)
        {
            _context.Users.Update(user);
            await _context.SaveChangesAsync();
            return user;
        }
        
        public async Task<bool> DeleteAsync(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return false;
            
            _context.Users.Remove(user);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}