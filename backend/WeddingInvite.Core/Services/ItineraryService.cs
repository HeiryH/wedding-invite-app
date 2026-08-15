using WeddingInvite.Core.DTOs;
using WeddingInvite.Data.Repositories;
using WeddingInvite.Models;

namespace WeddingInvite.Core.Services
{
    public class ItineraryService : IItineraryService
    {
        private readonly IItineraryRepository _itineraryRepo;
        private readonly IEventRepository _eventRepo;

        public ItineraryService(IItineraryRepository itineraryRepo, IEventRepository eventRepo)
        {
            _itineraryRepo = itineraryRepo;
            _eventRepo = eventRepo;
        }

        public async Task<ItineraryItemDto?> GetByIdAsync(int id)
        {
            var item = await _itineraryRepo.GetByIdAsync(id);
            return item == null ? null : MapToDto(item);
        }

        public async Task<IEnumerable<ItineraryItemDto>> GetByEventIdAsync(int eventId)
        {
            var items = await _itineraryRepo.GetByEventIdAsync(eventId);
            return items.Select(MapToDto);
        }

        public async Task<ItineraryItemDto> CreateAsync(int eventId, CreateItineraryItemDto dto)
        {
            var evt = await _eventRepo.GetByIdAsync(eventId);
            if (evt == null)
                throw new KeyNotFoundException($"Event with ID {eventId} not found");

            if (string.IsNullOrWhiteSpace(dto.Label))
                throw new ArgumentException("Label is required");

            var item = new ItineraryItem
            {
                EventId = eventId,
                Label = dto.Label.Trim(),
                Detail = dto.Detail.Trim(),
                SortOrder = dto.SortOrder,
            };

            var created = await _itineraryRepo.CreateAsync(item);
            return MapToDto(created);
        }

        public async Task<ItineraryItemDto> UpdateAsync(int id, UpdateItineraryItemDto dto)
        {
            var item = await _itineraryRepo.GetByIdAsync(id);
            if (item == null)
                throw new KeyNotFoundException($"Itinerary item with ID {id} not found");

            if (string.IsNullOrWhiteSpace(dto.Label))
                throw new ArgumentException("Label is required");

            item.Label = dto.Label.Trim();
            item.Detail = dto.Detail.Trim();
            item.SortOrder = dto.SortOrder;

            var updated = await _itineraryRepo.UpdateAsync(item);
            return MapToDto(updated);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            return await _itineraryRepo.DeleteAsync(id);
        }

        public async Task ReorderAsync(int eventId, ReorderItineraryDto dto)
        {
            var updates = dto.Items.Select(i => (i.ItineraryItemId, i.SortOrder)).ToList();
            await _itineraryRepo.ReorderAsync(eventId, updates);
        }

        private static ItineraryItemDto MapToDto(ItineraryItem item) => new()
        {
            ItineraryItemId = item.ItineraryItemId,
            EventId = item.EventId,
            Label = item.Label,
            Detail = item.Detail,
            SortOrder = item.SortOrder,
        };
    }
}
