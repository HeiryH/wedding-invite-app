using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using WeddingInvite.Core.DTOs;
using WeddingInvite.Core.Services;

namespace WeddingInvite.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class WishController : ControllerBase
    {
        private readonly IWishService _wishService;
        private readonly IEventAuthorizationService _eventAuthorizationService;

        public WishController(
            IWishService wishService,
            IEventAuthorizationService eventAuthorizationService)
        {
            _wishService = wishService;
            _eventAuthorizationService = eventAuthorizationService;
        }

        // GET: api/wish/event/5
        [HttpGet("event/{eventId}")]
        public async Task<ActionResult<IEnumerable<WishDto>>> GetByEventId(int eventId)
        {
            var wishes = await _wishService.GetByEventIdAsync(eventId);
            return Ok(wishes);
        }

        // POST: api/wish/event/5  (public — for wedding invitation page)
        [HttpPost("event/{eventId}")]
        [EnableRateLimiting("public-write")]
        public async Task<ActionResult<WishDto>> Create(
            int eventId,
            [FromBody] CreateWishDto createDto)
        {
            try
            {
                var wish = await _wishService.CreateAsync(eventId, createDto);
                return CreatedAtAction(nameof(GetByEventId), new { eventId }, wish);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // DELETE: api/wish/5  (authorized — couple admin only)
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<ActionResult> Delete(int id)
        {
            var wish = await _wishService.GetByIdAsync(id);
            if (wish == null)
                return NotFound(new { message = $"Wish with ID {id} not found" });

            var userEmail = User.Identity?.Name;
            if (!await _eventAuthorizationService.CanAccessEventAsync(userEmail!, wish.EventId))
                return Forbid();

            await _wishService.DeleteAsync(id);
            return NoContent();
        }
    }
}
