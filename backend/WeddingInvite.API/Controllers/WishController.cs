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
        
        // POST: api/wish/wedding/5
        [HttpPost("wedding/{weddingId}")]
        public async Task<ActionResult<WishDto>> Create(
            int weddingId, 
            [FromBody] CreateWishDto createDto)
        {
            try
            {
                var wish = await _wishService.CreateAsync(weddingId, createDto);
                return CreatedAtAction(
                    nameof(GetByWeddingId), 
                    new { weddingId }, 
                    wish
                );
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
        
        // DELETE: api/wish/5
        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(int id)
        {
            var result = await _wishService.DeleteAsync(id);
            
            if (!result)
                return NotFound(new { message = $"Wish with ID {id} not found" });
            
            return NoContent();
        }
    }
}