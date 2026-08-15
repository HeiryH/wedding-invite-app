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
                .Include(p => p.Event)
                .FirstOrDefaultAsync(p => p.PhotoId == id);
        }

        public async Task<IEnumerable<Photo>> GetByEventIdAsync(int eventId)
        {
            return await _context.Photos
                .AsNoTracking() // read-only list for display
                .Where(p => p.EventId == eventId && p.UploadedBy == PhotoUploaderRole.Guest)
                .OrderByDescending(p => p.CreatedDate)
                .ToListAsync();
        }

        public async Task<IEnumerable<Photo>> GetVisibleByEventIdAsync(int eventId)
        {
            return await _context.Photos
                .AsNoTracking() // read-only list for display
                .Where(p => p.EventId == eventId && p.UploadedBy == PhotoUploaderRole.Guest && p.IsVisible && p.IsApproved)
                .OrderByDescending(p => p.CreatedDate)
                .ToListAsync();
        }

        public async Task<IEnumerable<Photo>> GetCoupleMediaByEventIdAsync(int eventId)
        {
            return await _context.Photos
                .AsNoTracking() // read-only list for display
                .Where(p => p.EventId == eventId && p.UploadedBy == PhotoUploaderRole.Couple)
                .OrderBy(p => p.TemplateSlot)
                .ToListAsync();
        }

        public async Task<IEnumerable<Photo>> GetAllByEventIdAsync(int eventId)
        {
            return await _context.Photos
                .AsNoTracking() // read-only — the event export needs FilePath, not a DTO
                .Where(p => p.EventId == eventId)
                .OrderBy(p => p.UploadedBy).ThenBy(p => p.CreatedDate)
                .ToListAsync();
        }

        public async Task<Photo?> GetByTemplateSlotAsync(int eventId, int templateSlot)
        {
            return await _context.Photos
                .FirstOrDefaultAsync(p => p.EventId == eventId && p.UploadedBy == PhotoUploaderRole.Couple && p.TemplateSlot == templateSlot);
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

        public async Task<int> GetPhotoCountAsync(int eventId)
        {
            return await _context.Photos
                .Where(p => p.EventId == eventId && p.IsVisible && p.IsApproved)
                .CountAsync();
        }
    }
}
