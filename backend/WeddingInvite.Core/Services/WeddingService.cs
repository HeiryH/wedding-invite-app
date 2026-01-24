using WeddingInvite.Core.DTOs;
using WeddingInvite.Data.Repositories;
using WeddingInvite.Models;

namespace WeddingInvite.Core.Services
{
    public class WeddingService : IWeddingService
    {
        private readonly IWeddingRepository _weddingRepo;
        private readonly IGuestRepository _guestRepo;
        
        public WeddingService(
            IWeddingRepository weddingRepo,
            IGuestRepository guestRepo)
        {
            _weddingRepo = weddingRepo;
            _guestRepo = guestRepo;
        }
        
        public async Task<WeddingDto?> GetByIdAsync(int id)
        {
            var wedding = await _weddingRepo.GetByIdAsync(id);
            if (wedding == null) return null;
            
            return await MapToDto(wedding);
        }
        
        public async Task<WeddingDto?> GetByCoupleNameAsync(string coupleName)
        {
            var wedding = await _weddingRepo.GetByCoupleNameAsync(coupleName);
            if (wedding == null) return null;
            
            return await MapToDto(wedding);
        }
        
        public async Task<IEnumerable<WeddingDto>> GetAllAsync()
        {
            var weddings = await _weddingRepo.GetAllAsync();
            var dtos = new List<WeddingDto>();
            
            foreach (var wedding in weddings)
            {
                dtos.Add(await MapToDto(wedding));
            }
            
            return dtos;
        }
        
        public async Task<WeddingDto> CreateAsync(CreateWeddingDto createDto)
        {
            // BUSINESS VALIDATION
            
            // 1. Check if couple name is valid (alphanumeric + hyphens only)
            if (!IsValidCoupleName(createDto.CoupleName))
            {
                throw new ArgumentException(
                    "Couple name can only contain letters, numbers, and hyphens"
                );
            }
            
            // 2. Check if couple name already exists
            if (await _weddingRepo.CoupleNameExistsAsync(createDto.CoupleName))
            {
                throw new ArgumentException(
                    $"Couple name '{createDto.CoupleName}' is already taken"
                );
            }
            
            // 3. Check if wedding date is in the future
            if (createDto.WeddingDate < DateTime.UtcNow)
            {
                throw new ArgumentException("Wedding date must be in the future");
            }
            
            // 4. Check if required fields are filled
            if (string.IsNullOrWhiteSpace(createDto.BrideName))
                throw new ArgumentException("Bride name is required");
            
            if (string.IsNullOrWhiteSpace(createDto.GroomName))
                throw new ArgumentException("Groom name is required");
            
            // All validation passed! Create the wedding
            var wedding = new Wedding
            {
                CoupleName = createDto.CoupleName.ToLower().Trim(),
                BrideName = createDto.BrideName.Trim(),
                GroomName = createDto.GroomName.Trim(),
                WeddingDate = createDto.WeddingDate,
                Venue = createDto.Venue.Trim(),
                VenueAddress = createDto.VenueAddress.Trim(),
                CreatedDate = DateTime.UtcNow,
                IsActive = true
            };
            
            var created = await _weddingRepo.CreateAsync(wedding);
            return await MapToDto(created);
        }
        
        public async Task<WeddingDto> UpdateAsync(int id, UpdateWeddingDto updateDto)
        {
            var wedding = await _weddingRepo.GetByIdAsync(id);
            if (wedding == null)
                throw new KeyNotFoundException($"Wedding with ID {id} not found");
            
            // BUSINESS VALIDATION
            if (updateDto.WeddingDate < DateTime.UtcNow)
                throw new ArgumentException("Wedding date must be in the future");
            
            // Update fields
            wedding.BrideName = updateDto.BrideName.Trim();
            wedding.GroomName = updateDto.GroomName.Trim();
            wedding.WeddingDate = updateDto.WeddingDate;
            wedding.Venue = updateDto.Venue.Trim();
            wedding.VenueAddress = updateDto.VenueAddress.Trim();
            
            var updated = await _weddingRepo.UpdateAsync(wedding);
            return await MapToDto(updated);
        }
        
        public async Task<bool> DeleteAsync(int id)
        {
            var wedding = await _weddingRepo.GetByIdAsync(id);
            if (wedding == null) return false;
            
            // BUSINESS RULE: Don't actually delete, just mark as inactive
            // (So you can restore if needed)
            wedding.IsActive = false;
            await _weddingRepo.UpdateAsync(wedding);
            
            return true;
            
            // If you want hard delete instead:
            // return await _weddingRepo.DeleteAsync(id);
        }
        
        // HELPER METHODS
        
        private async Task<WeddingDto> MapToDto(Wedding wedding)
        {
            // Calculate computed fields
            var totalAttending = await _guestRepo.GetAttendingCountByWeddingIdAsync(wedding.WeddingId);
            var daysUntil = (wedding.WeddingDate - DateTime.UtcNow).Days;
            
            return new WeddingDto
            {
                WeddingId = wedding.WeddingId,
                CoupleName = wedding.CoupleName,
                BrideName = wedding.BrideName,
                GroomName = wedding.GroomName,
                WeddingDate = wedding.WeddingDate,
                Venue = wedding.Venue,
                VenueAddress = wedding.VenueAddress,
                TotalGuests = wedding.Guests.Count,
                TotalAttending = totalAttending,
                DaysUntilWedding = daysUntil > 0 ? daysUntil : 0,
                TotalPhotos = wedding.Photos.Count,
                EnabledFeaturesCount = wedding.WeddingFeatures.Count(wf => wf.IsEnabled)
            };
        }
        
        private bool IsValidCoupleName(string coupleName)
        {
            // Only allow: letters, numbers, hyphens
            // Examples: "john-and-mary", "sarah-mike-2025"
            return System.Text.RegularExpressions.Regex.IsMatch(
                coupleName, 
                @"^[a-zA-Z0-9-]+$"
            );
        }
    }
}