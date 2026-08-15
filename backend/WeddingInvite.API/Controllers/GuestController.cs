using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using WeddingInvite.Core.DTOs;
using WeddingInvite.Core.Services;

namespace WeddingInvite.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class GuestController : ControllerBase
    {
        private readonly IGuestService _guestService;
        private readonly IEventAuthorizationService _eventAuthorizationService;
        private readonly IEmailService _emailService;
        private readonly IAuthService _authService;

        public GuestController(
            IGuestService guestService,
            IEventAuthorizationService eventAuthorizationService,
            IEmailService emailService,
            IAuthService authService)
        {
            _guestService = guestService;
            _eventAuthorizationService = eventAuthorizationService;
            _emailService = emailService;
            _authService = authService;
        }

        // GET: api/guest/5
        [HttpGet("{id}")]
        public async Task<ActionResult<GuestDto>> GetById(int id)
        {
            var guest = await _guestService.GetByIdAsync(id);

            if (guest == null)
                return NotFound(new { message = $"Guest with ID {id} not found" });

            return Ok(guest);
        }

        // GET: api/guest/event/1            (full list — unchanged)
        // GET: api/guest/event/1?page=1&pageSize=50   (opt-in pagination; total in X-Total-Count)
        [HttpGet("event/{eventId}")]
        public async Task<ActionResult<IEnumerable<GuestDto>>> GetByEventId(
            int eventId, [FromQuery] int? page = null, [FromQuery] int? pageSize = null)
        {
            // ✅ Check authorization
            var userEmail = User.Identity?.Name;
            if (!await _eventAuthorizationService.CanAccessEventAsync(userEmail!, eventId))
                return Forbid();

            // Expose the unpaged total so clients can build page controls without a second call.
            if (page is > 0 && pageSize is > 0)
                Response.Headers["X-Total-Count"] = (await _guestService.GetCountAsync(eventId)).ToString();

            var guests = await _guestService.GetByEventIdAsync(eventId, page, pageSize);
            return Ok(guests);
        }

        // GET: api/guest/event/5/count
        [HttpGet("event/{eventId}/count")]
        public async Task<ActionResult<int>> GetAttendingCount(int eventId)
        {
            var count = await _guestService.GetAttendingCountAsync(eventId);
            return Ok(new { eventId, attendingCount = count });
        }

        // POST: api/guest (admin — authorized)
        [HttpPost]
        [Authorize]
        public async Task<ActionResult<GuestDto>> Create([FromBody] CreateGuestDto createDto)
        {
            // ✅ Check authorization
            var userEmail = User.Identity?.Name;
            if (!await _eventAuthorizationService.CanAccessEventAsync(userEmail!, createDto.EventId))
                return Forbid();

            try
            {
                var guest = await _guestService.CreateAsync(createDto.EventId, createDto);
                return Ok(guest);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        // POST: api/guest/rsvp (public — for wedding invitation page)
        [HttpPost("rsvp")]
        [AllowAnonymous]
        [EnableRateLimiting("public-write")]
        public async Task<ActionResult<GuestDto>> Rsvp([FromBody] CreateGuestDto createDto)
        {
            try
            {
                var guest = await _guestService.CreateAsync(createDto.EventId, createDto, enforceRsvpOpen: true);
                await SendRsvpEmailsAsync(createDto.EventId, guest);
                return Ok(guest);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // Notify the organizer of a new RSVP, and confirm to the guest if they left an email.
        // Email is fail-soft, so this never affects the RSVP response.
        private async Task SendRsvpEmailsAsync(int eventId, GuestDto guest)
        {
            if (!_emailService.IsConfigured) return;

            var attending = guest.IsAttending ? "attending" : "not attending";
            var organizer = await _authService.GetOrganizerAdminAsync(eventId);
            if (organizer != null && !string.IsNullOrWhiteSpace(organizer.Email))
            {
                var html = $@"<p>You have a new RSVP.</p>
<ul>
  <li><strong>{guest.GuestName}</strong> ({guest.GuestSide} side)</li>
  <li>Status: {attending} &middot; {guest.NumberOfAttendees} guest(s)</li>
</ul>";
                await _emailService.SendAsync(organizer.Email, $"New RSVP: {guest.GuestName}", html);
            }

            if (!string.IsNullOrWhiteSpace(guest.Email))
            {
                var html = $@"<p>Hi {guest.GuestName},</p>
<p>Thanks — your RSVP has been received ({attending}, {guest.NumberOfAttendees} guest(s)).</p>
<p>We look forward to celebrating with you!</p>";
                await _emailService.SendAsync(guest.Email, "Your RSVP is confirmed", html);
            }
        }

        // PUT: api/guest/5
        [HttpPut("{id}")]
        [Authorize]
        public async Task<ActionResult<GuestDto>> Update(int id, [FromBody] UpdateGuestDto updateDto)
        {
            // Get the guest to check event ownership
            var guest = await _guestService.GetByIdAsync(id);
            if (guest == null)
                return NotFound(new { message = "Guest not found" });

            // ✅ Check authorization
            var userEmail = User.Identity?.Name;
            if (!await _eventAuthorizationService.CanAccessEventAsync(userEmail!, guest.EventId))
                return Forbid();

            try
            {
                var updated = await _guestService.UpdateAsync(id, updateDto);
                return Ok(updated);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        // DELETE: api/guest/5
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> Delete(int id)
        {
            // Get the guest to check event ownership
            var guest = await _guestService.GetByIdAsync(id);
            if (guest == null)
                return NotFound(new { message = "Guest not found" });

            // ✅ Check authorization
            var userEmail = User.Identity?.Name;
            if (!await _eventAuthorizationService.CanAccessEventAsync(userEmail!, guest.EventId))
                return Forbid();

            var success = await _guestService.DeleteAsync(id);
            if (!success)
                return NotFound(new { message = "Guest not found" });

            return Ok(new { message = "Guest deleted successfully" });
        }
    }
}
