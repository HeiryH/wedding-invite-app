using WeddingInvite.Core.DTOs;
using WeddingInvite.Data.Repositories;
using WeddingInvite.Models;

namespace WeddingInvite.Core.Services
{
    public class GuestService : IGuestService
    {
        private readonly IGuestRepository _guestRepo;
        private readonly IWeddingRepository _weddingRepo;
        
        public GuestService(
            IGuestRepository guestRepo,
            IWeddingRepository weddingRepo)
        {
            _guestRepo = guestRepo;
            _weddingRepo = weddingRepo;
        }
        
        public async Task<GuestDto?> GetByIdAsync(int id)
        {
            var guest = await _guestRepo.GetByIdAsync(id);
            if (guest == null) return null;
            
            return MapToDto(guest);
        }
        
        public async Task<IEnumerable<GuestDto>> GetByWeddingIdAsync(int weddingId)
        {
            var guests = await _guestRepo.GetByWeddingIdAsync(weddingId);
            return guests.Select(MapToDto);
        }
        
        public async Task<GuestDto> CreateAsync(int weddingId, CreateGuestDto createDto)
        {
            // BUSINESS VALIDATION
            
            // 1. Check if wedding exists
            var wedding = await _weddingRepo.GetByIdAsync(weddingId);
            if (wedding == null)
                throw new KeyNotFoundException($"Wedding with ID {weddingId} not found");
            
            // 2. Check if wedding has already passed
            if (wedding.WeddingDate < DateTime.UtcNow)
                throw new InvalidOperationException("Cannot RSVP to a past wedding");
            
            // 3. Validate guest name
            if (string.IsNullOrWhiteSpace(createDto.GuestName))
                throw new ArgumentException("Guest name is required");
            
            // 4. Validate side selection
            if (createDto.BrideOrGroomSide != "Bride" && createDto.BrideOrGroomSide != "Groom")
                throw new ArgumentException("Please select either Bride or Groom side");
            
            // 5. Validate number of attendees
            if (createDto.NumberOfAttendees < 1)
                throw new ArgumentException("Number of attendees must be at least 1");
            
            if (createDto.NumberOfAttendees > 10)
                throw new ArgumentException("Maximum 10 attendees per RSVP");

            // 6. Check per-entry pax limit
            if (wedding.MaxPax > 0 && createDto.NumberOfAttendees > wedding.MaxPax)
                throw new ArgumentException($"Maximum {wedding.MaxPax} guest(s) per RSVP.");

            // Create guest
            var guest = new Guest
            {
                WeddingId = weddingId,
                GuestName = createDto.GuestName.Trim(),
                Email = createDto.Email.Trim(),
                PhoneNumber = createDto.PhoneNumber.Trim(),
                BrideOrGroomSide = createDto.BrideOrGroomSide,
                NumberOfAttendees = createDto.NumberOfAttendees,
                SongRequest = createDto.SongRequest.Trim(),
                IsAttending = createDto.IsAttending,
                RespondedDate = DateTime.UtcNow,
                TableId = createDto.IsAttending ? createDto.TableId : null,
            };
            
            var created = await _guestRepo.CreateAsync(guest);
            return MapToDto(created);
        }
        
        public async Task<GuestDto> UpdateAsync(int id, UpdateGuestDto updateDto)
        {
            var guest = await _guestRepo.GetByIdAsync(id);
            if (guest == null)
                throw new KeyNotFoundException($"Guest with ID {id} not found");

            guest.GuestName = updateDto.GuestName.Trim();
            guest.Email = updateDto.Email.Trim();
            guest.PhoneNumber = updateDto.PhoneNumber.Trim();
            guest.BrideOrGroomSide = updateDto.BrideOrGroomSide;
            guest.NumberOfAttendees = updateDto.NumberOfAttendees;
            guest.SongRequest = updateDto.SongRequest.Trim();
            guest.IsAttending = updateDto.IsAttending;

            var updated = await _guestRepo.UpdateAsync(guest);
            return MapToDto(updated);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            return await _guestRepo.DeleteAsync(id);
        }
        
        public async Task<int> GetAttendingCountAsync(int weddingId)
        {
            return await _guestRepo.GetAttendingCountByWeddingIdAsync(weddingId);
        }
        
        // HELPER METHOD
        private GuestDto MapToDto(Guest guest)
        {
            return new GuestDto
            {
                GuestId = guest.GuestId,
                WeddingId = guest.WeddingId,
                GuestName = guest.GuestName,
                Email = guest.Email,
                PhoneNumber = guest.PhoneNumber,
                BrideOrGroomSide = guest.BrideOrGroomSide,
                NumberOfAttendees = guest.NumberOfAttendees,
                SongRequest = guest.SongRequest,
                IsAttending = guest.IsAttending,
                RespondedDate = guest.RespondedDate,
                TableId = guest.TableId,
                TableName = guest.Table?.TableName,
            };
        }
    }
}