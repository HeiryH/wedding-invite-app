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
        
        public GuestController(IGuestService guestService)
        {
            _guestService = guestService;
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
        
        // GET: api/guest/wedding/5
        [HttpGet("wedding/{weddingId}")]
        public async Task<ActionResult<IEnumerable<GuestDto>>> GetByWeddingId(int weddingId)
        {
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
        
        // POST: api/guest/wedding/5
        [HttpPost("wedding/{weddingId}")]
        public async Task<ActionResult<GuestDto>> Create(
            int weddingId, 
            [FromBody] CreateGuestDto createDto)
        {
            try
            {
                var guest = await _guestService.CreateAsync(weddingId, createDto);
                
                return CreatedAtAction(
                    nameof(GetById), 
                    new { id = guest.GuestId }, 
                    guest
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
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
        
        // DELETE: api/guest/5
        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(int id)
        {
            var result = await _guestService.DeleteAsync(id);
            
            if (!result)
                return NotFound(new { message = $"Guest with ID {id} not found" });
            
            return NoContent();
        }
    }
}