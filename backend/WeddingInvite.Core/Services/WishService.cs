using WeddingInvite.Core.DTOs;
using WeddingInvite.Data.Repositories;
using WeddingInvite.Models;

namespace WeddingInvite.Core.Services
{
    public class WishService : IWishService
    {
        private readonly IWishRepository _wishRepo;
        private readonly IEventRepository _eventRepo;

        public WishService(
            IWishRepository wishRepo,
            IEventRepository eventRepo)
        {
            _wishRepo = wishRepo;
            _eventRepo = eventRepo;
        }

        public async Task<WishDto?> GetByIdAsync(int id)
        {
            var wish = await _wishRepo.GetByIdAsync(id);
            return wish == null ? null : MapToDto(wish);
        }

        public async Task<IEnumerable<WishDto>> GetByEventIdAsync(int eventId)
        {
            var wishes = await _wishRepo.GetByEventIdAsync(eventId);
            return wishes.Select(MapToDto);
        }

        public async Task<WishDto> CreateAsync(int eventId, CreateWishDto createDto)
        {
            // BUSINESS VALIDATION

            // 1. Check if event exists
            var evt = await _eventRepo.GetByIdAsync(eventId);
            if (evt == null)
                throw new KeyNotFoundException($"Event with ID {eventId} not found");

            // 1b. Block wishes on private (self-serve free) events
            if (!evt.IsPublic)
                throw new InvalidOperationException("This invitation is not yet shared publicly.");

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
                EventId = eventId,
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
                EventId = wish.EventId,
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
