using WeddingInvite.Core.DTOs;
using WeddingInvite.Data.Repositories;
using WeddingInvite.Models;

namespace WeddingInvite.Core.Services
{
    public class WishService : IWishService
    {
        private readonly IWishRepository _wishRepo;
        private readonly IWeddingRepository _weddingRepo;
        
        public WishService(
            IWishRepository wishRepo,
            IWeddingRepository weddingRepo)
        {
            _wishRepo = wishRepo;
            _weddingRepo = weddingRepo;
        }
        
        public async Task<IEnumerable<WishDto>> GetByWeddingIdAsync(int weddingId)
        {
            var wishes = await _wishRepo.GetByWeddingIdAsync(weddingId);
            return wishes.Select(MapToDto);
        }
        
        public async Task<WishDto> CreateAsync(int weddingId, CreateWishDto createDto)
        {
            // BUSINESS VALIDATION
            
            // 1. Check if wedding exists
            var wedding = await _weddingRepo.GetByIdAsync(weddingId);
            if (wedding == null)
                throw new KeyNotFoundException($"Wedding with ID {weddingId} not found");
            
            // 2. Validate guest name
            if (string.IsNullOrWhiteSpace(createDto.GuestName))
                throw new ArgumentException("Name is required");
            
            // 3. Validate message
            if (string.IsNullOrWhiteSpace(createDto.Message))
                throw new ArgumentException("Message is required");
            
            if (createDto.Message.Length > 1000)
                throw new ArgumentException("Message cannot exceed 1000 characters");
            
            // 4. Basic profanity/spam filter (optional, but good practice)
            if (ContainsProfanity(createDto.Message))
                throw new ArgumentException("Please keep your message respectful");
            
            // Create wish
            var wish = new Wish
            {
                WeddingId = weddingId,
                GuestName = createDto.GuestName.Trim(),
                Message = createDto.Message.Trim(),
                CreatedDate = DateTime.UtcNow
            };
            
            var created = await _wishRepo.CreateAsync(wish);
            return MapToDto(created);
        }
        
        public async Task<bool> DeleteAsync(int id)
        {
            return await _wishRepo.DeleteAsync(id);
        }
        
        // HELPER METHODS
        private WishDto MapToDto(Wish wish)
        {
            return new WishDto
            {
                WishId = wish.WishId,
                WeddingId = wish.WeddingId,
                GuestName = wish.GuestName,
                Message = wish.Message,
                CreatedDate = wish.CreatedDate
            };
        }
        
        private bool ContainsProfanity(string message)
        {
            // Simple check - in production you'd use a proper library
            var badWords = new[] { "spam", "viagra", "casino" }; // Add more as needed
            var lowerMessage = message.ToLower();
            
            return badWords.Any(word => lowerMessage.Contains(word));
        }
    }
}