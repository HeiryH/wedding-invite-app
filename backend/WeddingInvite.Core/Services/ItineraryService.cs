using WeddingInvite.Core.DTOs;
using WeddingInvite.Data.Repositories;
using WeddingInvite.Models;

namespace WeddingInvite.Core.Services
{
    public class ItineraryService : IItineraryService
    {
        private readonly IItineraryRepository _itineraryRepo;
        private readonly IWeddingRepository _weddingRepo;

        public ItineraryService(IItineraryRepository itineraryRepo, IWeddingRepository weddingRepo)
        {
            _itineraryRepo = itineraryRepo;
            _weddingRepo = weddingRepo;
        }

        public async Task<ItineraryItemDto?> GetByIdAsync(int id)
        {
            var item = await _itineraryRepo.GetByIdAsync(id);
            return item == null ? null : MapToDto(item);
        }

        public async Task<IEnumerable<ItineraryItemDto>> GetByWeddingIdAsync(int weddingId)
        {
            var items = await _itineraryRepo.GetByWeddingIdAsync(weddingId);
            return items.Select(MapToDto);
        }

        public async Task<ItineraryItemDto> CreateAsync(int weddingId, CreateItineraryItemDto dto)
        {
            var wedding = await _weddingRepo.GetByIdAsync(weddingId);
            if (wedding == null)
                throw new KeyNotFoundException($"Wedding with ID {weddingId} not found");

            if (string.IsNullOrWhiteSpace(dto.Label))
                throw new ArgumentException("Label is required");

            var item = new ItineraryItem
            {
                WeddingId = weddingId,
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

        public async Task ReorderAsync(int weddingId, ReorderItineraryDto dto)
        {
            var updates = dto.Items.Select(i => (i.ItineraryItemId, i.SortOrder)).ToList();
            await _itineraryRepo.ReorderAsync(weddingId, updates);
        }

        private static ItineraryItemDto MapToDto(ItineraryItem item) => new()
        {
            ItineraryItemId = item.ItineraryItemId,
            WeddingId = item.WeddingId,
            Label = item.Label,
            Detail = item.Detail,
            SortOrder = item.SortOrder,
        };
    }
}
