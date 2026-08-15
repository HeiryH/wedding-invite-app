using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WeddingInvite.Core.DTOs;
using WeddingInvite.Core.Services;

namespace WeddingInvite.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ItineraryController : ControllerBase
    {
        private readonly IItineraryService _itineraryService;
        private readonly IEventAuthorizationService _eventAuthorizationService;

        public ItineraryController(
            IItineraryService itineraryService,
            IEventAuthorizationService eventAuthorizationService)
        {
            _itineraryService = itineraryService;
            _eventAuthorizationService = eventAuthorizationService;
        }

        // GET: api/itinerary/event/1  (public)
        [HttpGet("event/{eventId}")]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<ItineraryItemDto>>> GetByEventId(int eventId)
        {
            var items = await _itineraryService.GetByEventIdAsync(eventId);
            return Ok(items);
        }

        // POST: api/itinerary/event/1
        [HttpPost("event/{eventId}")]
        [Authorize]
        public async Task<ActionResult<ItineraryItemDto>> Create(int eventId, [FromBody] CreateItineraryItemDto dto)
        {
            var userEmail = User.Identity?.Name;
            if (!await _eventAuthorizationService.CanAccessEventAsync(userEmail!, eventId))
                return Forbid();

            try
            {
                var item = await _itineraryService.CreateAsync(eventId, dto);
                return Ok(item);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // PUT: api/itinerary/5
        [HttpPut("{id}")]
        [Authorize]
        public async Task<ActionResult<ItineraryItemDto>> Update(int id, [FromBody] UpdateItineraryItemDto dto)
        {
            var existing = await _itineraryService.GetByIdAsync(id);
            if (existing == null)
                return NotFound(new { message = "Itinerary item not found" });

            var userEmail = User.Identity?.Name;
            if (!await _eventAuthorizationService.CanAccessEventAsync(userEmail!, existing.EventId))
                return Forbid();

            try
            {
                var updated = await _itineraryService.UpdateAsync(id, dto);
                return Ok(updated);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // DELETE: api/itinerary/5
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> Delete(int id)
        {
            var existing = await _itineraryService.GetByIdAsync(id);
            if (existing == null)
                return NotFound(new { message = "Itinerary item not found" });

            var userEmail = User.Identity?.Name;
            if (!await _eventAuthorizationService.CanAccessEventAsync(userEmail!, existing.EventId))
                return Forbid();

            await _itineraryService.DeleteAsync(id);
            return Ok(new { message = "Deleted successfully" });
        }

        // PUT: api/itinerary/event/1/reorder
        [HttpPut("event/{eventId}/reorder")]
        [Authorize]
        public async Task<IActionResult> Reorder(int eventId, [FromBody] ReorderItineraryDto dto)
        {
            var userEmail = User.Identity?.Name;
            if (!await _eventAuthorizationService.CanAccessEventAsync(userEmail!, eventId))
                return Forbid();

            await _itineraryService.ReorderAsync(eventId, dto);
            return Ok(new { message = "Reordered successfully" });
        }
    }
}
