using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WeddingInvite.Core.DTOs;
using WeddingInvite.Core.Services;

namespace WeddingInvite.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class WishController : ControllerBase
    {
        private readonly IWishService _wishService;
        private readonly IWeddingAuthorizationService _weddingAuthorizationService; // ✅ RENAMED
        
        public WishController(
            IWishService wishService,
            IWeddingAuthorizationService weddingAuthorizationService) // ✅ INJECTED
        {
            _wishService = wishService;
            _weddingAuthorizationService = weddingAuthorizationService; // ✅ ASSIGNED
        }
        
        // GET: api/wish/wedding/5
        [HttpGet("wedding/{weddingId}")]
        public async Task<ActionResult<IEnumerable<WishDto>>> GetByWeddingId(int weddingId)
        {
            var wishes = await _wishService.GetByWeddingIdAsync(weddingId);
            return Ok(wishes);
        }
        
        // POST: api/wish/wedding/5  (public — for wedding invitation page)
        [HttpPost("wedding/{weddingId}")]
        public async Task<ActionResult<WishDto>> Create(
            int weddingId,
            [FromBody] CreateWishDto createDto)
        {
            try
            {
                var wish = await _wishService.CreateAsync(weddingId, createDto);
                return CreatedAtAction(nameof(GetByWeddingId), new { weddingId }, wish);
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
            if (!await _weddingAuthorizationService.CanAccessWeddingAsync(userEmail!, wish.WeddingId))
                return Forbid();

            await _wishService.DeleteAsync(id);
            return NoContent();
        }
    }
}