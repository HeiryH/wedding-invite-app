using WeddingInvite.Core.DTOs;
using WeddingInvite.Data.Repositories;
using WeddingInvite.Models;

namespace WeddingInvite.Core.Services
{
    public class GuestService : IGuestService
    {
        private readonly IGuestRepository _guestRepo;
        private readonly IEventRepository _eventRepo;

        public GuestService(
            IGuestRepository guestRepo,
            IEventRepository eventRepo)
        {
            _guestRepo = guestRepo;
            _eventRepo = eventRepo;
        }

        public async Task<GuestDto?> GetByIdAsync(int id)
        {
            var guest = await _guestRepo.GetByIdAsync(id);
            if (guest == null) return null;

            return MapToDto(guest);
        }

        public async Task<IEnumerable<GuestDto>> GetByEventIdAsync(int eventId, int? page = null, int? pageSize = null)
        {
            int? skip = null, take = null;
            if (page is > 0 && pageSize is > 0)
            {
                skip = (page.Value - 1) * pageSize.Value;
                take = pageSize.Value;
            }
            var guests = await _guestRepo.GetByEventIdAsync(eventId, skip, take);
            return guests.Select(MapToDto);
        }

        public async Task<int> GetCountAsync(int eventId)
        {
            return await _guestRepo.CountByEventIdAsync(eventId);
        }

        public async Task<GuestDto> CreateAsync(int eventId, CreateGuestDto createDto, bool enforceRsvpOpen = false)
        {
            // BUSINESS VALIDATION

            // 1. Check if event exists
            var evt = await _eventRepo.GetByIdAsync(eventId);
            if (evt == null)
                throw new KeyNotFoundException($"Event with ID {eventId} not found");

            // 2. Check if event has already passed
            if (evt.EventDate < DateTime.UtcNow)
                throw new InvalidOperationException("Cannot RSVP to a past event");

            // 2b. Block RSVP on private (self-serve free) events
            if (enforceRsvpOpen && !evt.IsPublic)
                throw new InvalidOperationException("This invitation is not yet shared publicly.");

            // 2c. Check if RSVPs are open (only enforced on public submissions)
            if (enforceRsvpOpen && !evt.IsRsvpOpen)
                throw new ArgumentException("RSVPs are closed for this event.");

            // 3. Validate guest name
            if (string.IsNullOrWhiteSpace(createDto.GuestName))
                throw new ArgumentException("Guest name is required");

            // 4. Validate side selection — only required/meaningful for WEDDING events. Non-WEDDING
            //    events don't have a "side" concept, so the value is simply not required or stored.
            string? guestSide = null;
            if (evt.EventType == Models.EventTypes.Wedding)
            {
                if (createDto.GuestSide != "PRIMARY" && createDto.GuestSide != "SECONDARY")
                    throw new ArgumentException("Please select either Bride or Groom side");
                guestSide = createDto.GuestSide;
            }

            // 5. Validate number of attendees
            if (createDto.NumberOfAttendees < 1)
                throw new ArgumentException("Number of attendees must be at least 1");

            if (createDto.NumberOfAttendees > 10)
                throw new ArgumentException("Maximum 10 attendees per RSVP");

            // 6. Check per-entry pax limit (MaxPax)
            if (evt.MaxPax > 0 && createDto.NumberOfAttendees > evt.MaxPax)
                throw new ArgumentException($"Maximum {evt.MaxPax} guest(s) per RSVP.");

            // 7. Check total event capacity (MaxCapacity)
            if (evt.MaxCapacity > 0 && createDto.IsAttending)
            {
                var currentPax = await _guestRepo.GetAttendingCountByEventIdAsync(eventId);
                if (currentPax + createDto.NumberOfAttendees > evt.MaxCapacity)
                    throw new ArgumentException("Sorry, this event has reached its guest capacity.");
            }

            // Create guest
            var guest = new Guest
            {
                EventId = eventId,
                GuestName = createDto.GuestName.Trim(),
                Email = createDto.Email.Trim(),
                PhoneNumber = createDto.PhoneNumber.Trim(),
                GuestSide = guestSide,
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
            guest.GuestSide = updateDto.GuestSide;
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

        public async Task<int> GetAttendingCountAsync(int eventId)
        {
            return await _guestRepo.GetAttendingCountByEventIdAsync(eventId);
        }

        // HELPER METHOD
        private GuestDto MapToDto(Guest guest)
        {
            return new GuestDto
            {
                GuestId = guest.GuestId,
                EventId = guest.EventId,
                GuestName = guest.GuestName,
                Email = guest.Email,
                PhoneNumber = guest.PhoneNumber,
                GuestSide = guest.GuestSide,
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
