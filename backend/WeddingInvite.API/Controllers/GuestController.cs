using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WeddingInvite.Core.DTOs;
using WeddingInvite.Core.Services;

namespace WeddingInvite.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class GuestController : ControllerBase
    {
        private readonly IGuestService _guestService;
        private readonly IWeddingAuthorizationService _weddingAuthorizationService;
        
        public GuestController(
            IGuestService guestService,
            IWeddingAuthorizationService weddingAuthorizationService)
        {
            _guestService = guestService;
            _weddingAuthorizationService = weddingAuthorizationService;
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
        
        // GET: api/guest/wedding/1
        [HttpGet("wedding/{weddingId}")]
        public async Task<ActionResult<IEnumerable<GuestDto>>> GetByWeddingId(int weddingId)
        {
            // ✅ Check authorization
            var userEmail = User.Identity?.Name;
            if (!await _weddingAuthorizationService.CanAccessWeddingAsync(userEmail!, weddingId))
                return Forbid();

            var guests = await _guestService.GetByWeddingIdAsync(weddingId);
            return Ok(guests);
        }

        // GET: api/guest/wedding/5/count
        [HttpGet("wedding/{weddingId}/count")]
        public async Task<ActionResult<int>> GetAttendingCount(int weddingId)
        {
            var count = await _guestService.GetAttendingCountAsync(weddingId);
            return Ok(new { weddingId, attendingCount = count });
        }
        
        // POST: api/guest (admin — authorized)
        [HttpPost]
        [Authorize]
        public async Task<ActionResult<GuestDto>> Create([FromBody] CreateGuestDto createDto)
        {
            // ✅ Check authorization
            var userEmail = User.Identity?.Name;
            if (!await _weddingAuthorizationService.CanAccessWeddingAsync(userEmail!, createDto.WeddingId))
                return Forbid();

            try
            {
                var guest = await _guestService.CreateAsync(createDto.WeddingId, createDto);
                return Ok(guest);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // POST: api/guest/rsvp (public — for wedding invitation page)
        [HttpPost("rsvp")]
        [AllowAnonymous]
        public async Task<ActionResult<GuestDto>> Rsvp([FromBody] CreateGuestDto createDto)
        {
            try
            {
                var guest = await _guestService.CreateAsync(createDto.WeddingId, createDto);
                return Ok(guest);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
        
        // PUT: api/guest/5
        [HttpPut("{id}")]
        [Authorize]
        public async Task<ActionResult<GuestDto>> Update(int id, [FromBody] UpdateGuestDto updateDto)
        {
            // Get the guest to check wedding ownership
            var guest = await _guestService.GetByIdAsync(id);
            if (guest == null)
                return NotFound(new { message = "Guest not found" });

            // ✅ Check authorization
            var userEmail = User.Identity?.Name;
            if (!await _weddingAuthorizationService.CanAccessWeddingAsync(userEmail!, guest.WeddingId))
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
            // Get the guest to check wedding ownership
            var guest = await _guestService.GetByIdAsync(id);
            if (guest == null)
                return NotFound(new { message = "Guest not found" });

            // ✅ Check authorization
            var userEmail = User.Identity?.Name;
            if (!await _weddingAuthorizationService.CanAccessWeddingAsync(userEmail!, guest.WeddingId))
                return Forbid();

            var success = await _guestService.DeleteAsync(id);
            if (!success)
                return NotFound(new { message = "Guest not found" });
            
            return Ok(new { message = "Guest deleted successfully" });
        }
    }
}