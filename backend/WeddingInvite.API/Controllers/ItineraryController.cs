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
        private readonly IWeddingAuthorizationService _weddingAuthorizationService;

        public ItineraryController(
            IItineraryService itineraryService,
            IWeddingAuthorizationService weddingAuthorizationService)
        {
            _itineraryService = itineraryService;
            _weddingAuthorizationService = weddingAuthorizationService;
        }

        // GET: api/itinerary/wedding/1  (public)
        [HttpGet("wedding/{weddingId}")]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<ItineraryItemDto>>> GetByWeddingId(int weddingId)
        {
            var items = await _itineraryService.GetByWeddingIdAsync(weddingId);
            return Ok(items);
        }

        // POST: api/itinerary/wedding/1
        [HttpPost("wedding/{weddingId}")]
        [Authorize]
        public async Task<ActionResult<ItineraryItemDto>> Create(int weddingId, [FromBody] CreateItineraryItemDto dto)
        {
            var userEmail = User.Identity?.Name;
            if (!await _weddingAuthorizationService.CanAccessWeddingAsync(userEmail!, weddingId))
                return Forbid();

            try
            {
                var item = await _itineraryService.CreateAsync(weddingId, dto);
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
            if (!await _weddingAuthorizationService.CanAccessWeddingAsync(userEmail!, existing.WeddingId))
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
            if (!await _weddingAuthorizationService.CanAccessWeddingAsync(userEmail!, existing.WeddingId))
                return Forbid();

            await _itineraryService.DeleteAsync(id);
            return Ok(new { message = "Deleted successfully" });
        }

        // PUT: api/itinerary/wedding/1/reorder
        [HttpPut("wedding/{weddingId}/reorder")]
        [Authorize]
        public async Task<IActionResult> Reorder(int weddingId, [FromBody] ReorderItineraryDto dto)
        {
            var userEmail = User.Identity?.Name;
            if (!await _weddingAuthorizationService.CanAccessWeddingAsync(userEmail!, weddingId))
                return Forbid();

            await _itineraryService.ReorderAsync(weddingId, dto);
            return Ok(new { message = "Reordered successfully" });
        }
    }
}
