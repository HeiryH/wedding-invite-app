using Microsoft.EntityFrameworkCore;
using WeddingInvite.Models;

namespace WeddingInvite.Data.Repositories
{
    public class PhotoRepository : IPhotoRepository
    {
        private readonly AppDbContext _context;
        
        public PhotoRepository(AppDbContext context)
        {
            _context = context;
        }
        
        public async Task<Photo?> GetByIdAsync(int id)
        {
            return await _context.Photos
                .Include(p => p.Wedding)
                .FirstOrDefaultAsync(p => p.PhotoId == id);
        }
        
        public async Task<IEnumerable<Photo>> GetByWeddingIdAsync(int weddingId)
        {
            return await _context.Photos
                .Where(p => p.WeddingId == weddingId)
                .OrderByDescending(p => p.UploadedDate)
                .ToListAsync();
        }
        
        public async Task<IEnumerable<Photo>> GetVisibleByWeddingIdAsync(int weddingId)
        {
            return await _context.Photos
                .Where(p => p.WeddingId == weddingId && p.IsVisible && p.IsApproved)
                .OrderByDescending(p => p.UploadedDate)
                .ToListAsync();
        }
        
        public async Task<Photo> CreateAsync(Photo photo)
        {
            _context.Photos.Add(photo);
            await _context.SaveChangesAsync();
            return photo;
        }
        
        public async Task<Photo> UpdateAsync(Photo photo)
        {
            _context.Photos.Update(photo);
            await _context.SaveChangesAsync();
            return photo;
        }
        
        public async Task<bool> DeleteAsync(int id)
        {
            var photo = await _context.Photos.FindAsync(id);
            if (photo == null) return false;
            
            _context.Photos.Remove(photo);
            await _context.SaveChangesAsync();
            return true;
        }
        
        public async Task<int> GetPhotoCountAsync(int weddingId)
        {
            return await _context.Photos
                .Where(p => p.WeddingId == weddingId && p.IsVisible && p.IsApproved)
                .CountAsync();
        }
    }
}