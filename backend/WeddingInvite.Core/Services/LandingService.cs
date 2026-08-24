using WeddingInvite.Core.DTOs;
using WeddingInvite.Data.Repositories;
using WeddingInvite.Models;

namespace WeddingInvite.Core.Services
{
    public class LandingService : ILandingService
    {
        private readonly ILandingRepository _repo;
        private const int MaxContentKeys = 200;
        private const int MaxValueLength = 8000;

        public LandingService(ILandingRepository repo)
        {
            _repo = repo;
        }

        public async Task<LandingDto> GetAsync()
        {
            var content = await _repo.GetContentAsync();
            var sections = await _repo.GetSectionsAsync();
            var items = await _repo.GetItemsAsync();
            return new LandingDto
            {
                Content = content.ToDictionary(c => c.ContentKey, c => c.ContentValue),
                Sections = sections.Select(MapSection).ToList(),
                Items = items.Select(MapItem).ToList(),
            };
        }

        public async Task SaveContentAsync(Dictionary<string, string> content)
        {
            // Bound the bag defensively (super-admin only, but still).
            var clean = content
                .Where(kv => !string.IsNullOrWhiteSpace(kv.Key))
                .Take(MaxContentKeys)
                .ToDictionary(kv => kv.Key, kv => (kv.Value ?? string.Empty).Length > MaxValueLength
                    ? kv.Value!.Substring(0, MaxValueLength)
                    : kv.Value ?? string.Empty);
            await _repo.SaveContentAsync(clean);
        }

        public async Task<LandingSectionDto> UpsertSectionAsync(UpsertLandingSectionDto dto)
        {
            var saved = await _repo.UpsertSectionAsync(new LandingSection
            {
                SectionKey = dto.SectionKey,
                Title = dto.Title,
                SortOrder = dto.SortOrder,
                IsVisible = dto.IsVisible,
            });
            return MapSection(saved);
        }

        public async Task<LandingItemDto> CreateItemAsync(UpsertLandingItemDto dto)
        {
            var saved = await _repo.CreateItemAsync(ToEntity(dto));
            return MapItem(saved);
        }

        public async Task<LandingItemDto?> UpdateItemAsync(int id, UpsertLandingItemDto dto)
        {
            var saved = await _repo.UpdateItemAsync(id, ToEntity(dto));
            return saved == null ? null : MapItem(saved);
        }

        public Task<bool> DeleteItemAsync(int id) => _repo.DeleteItemAsync(id);

        private static LandingItem ToEntity(UpsertLandingItemDto dto) => new()
        {
            SectionKey = dto.SectionKey,
            SortOrder = dto.SortOrder,
            IsActive = dto.IsActive,
            Title = dto.Title,
            Body = dto.Body,
            ImageUrl = dto.ImageUrl,
            Meta = dto.Meta,
            Price = dto.Price,
            Features = dto.Features,
            Cta = dto.Cta,
            CtaHref = dto.CtaHref,
            Highlighted = dto.Highlighted,
        };

        private static LandingSectionDto MapSection(LandingSection s) => new()
        {
            Id = s.Id, SectionKey = s.SectionKey, Title = s.Title, SortOrder = s.SortOrder, IsVisible = s.IsVisible,
        };

        private static LandingItemDto MapItem(LandingItem i) => new()
        {
            Id = i.Id, SectionKey = i.SectionKey, SortOrder = i.SortOrder, IsActive = i.IsActive,
            Title = i.Title, Body = i.Body, ImageUrl = i.ImageUrl, Meta = i.Meta,
            Price = i.Price, Features = i.Features, Cta = i.Cta, CtaHref = i.CtaHref, Highlighted = i.Highlighted,
        };
    }
}
