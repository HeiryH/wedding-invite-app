using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WeddingInvite.Core.DTOs;
using WeddingInvite.Core.Services;

namespace WeddingInvite.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TableController : ControllerBase
    {
        private readonly ITableService _tableService;
        private readonly IWeddingAuthorizationService _weddingAuthorizationService;
        private readonly IGuestService _guestService;

        public TableController(
            ITableService tableService,
            IWeddingAuthorizationService weddingAuthorizationService,
            IGuestService guestService)
        {
            _tableService = tableService;
            _weddingAuthorizationService = weddingAuthorizationService;
            _guestService = guestService;
        }

        // GET: api/table/wedding/1
        [HttpGet("wedding/{weddingId}")]
        public async Task<ActionResult<IEnumerable<TableDto>>> GetByWeddingId(int weddingId)
        {
            var tables = await _tableService.GetByWeddingIdAsync(weddingId);
            return Ok(tables);
        }

        // POST: api/table
        [HttpPost]
        [Authorize]
        public async Task<ActionResult<TableDto>> Create([FromBody] CreateTableDto dto)
        {
            var userEmail = User.Identity?.Name;
            if (!await _weddingAuthorizationService.CanAccessWeddingAsync(userEmail!, dto.WeddingId))
                return Forbid();

            try
            {
                var table = await _tableService.CreateAsync(dto);
                return Ok(table);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // PUT: api/table/5
        [HttpPut("{id}")]
        [Authorize]
        public async Task<ActionResult<TableDto>> Update(int id, [FromBody] UpdateTableDto dto)
        {
            var existing = await _tableService.GetByIdAsync(id);
            if (existing == null)
                return NotFound(new { message = "Table not found" });

            var userEmail = User.Identity?.Name;
            if (!await _weddingAuthorizationService.CanAccessWeddingAsync(userEmail!, existing.WeddingId))
                return Forbid();

            try
            {
                var updated = await _tableService.UpdateAsync(id, dto);
                return Ok(updated);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // DELETE: api/table/5
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> Delete(int id)
        {
            var existing = await _tableService.GetByIdAsync(id);
            if (existing == null)
                return NotFound(new { message = "Table not found" });

            var userEmail = User.Identity?.Name;
            if (!await _weddingAuthorizationService.CanAccessWeddingAsync(userEmail!, existing.WeddingId))
                return Forbid();

            await _tableService.DeleteAsync(id);
            return Ok(new { message = "Table deleted successfully" });
        }

        // PUT: api/table/{tableId}/assign/{guestId}
        [HttpPut("{tableId}/assign/{guestId}")]
        [Authorize]
        public async Task<IActionResult> AssignGuest(int tableId, int guestId)
        {
            var guest = await _guestService.GetByIdAsync(guestId);
            if (guest == null)
                return NotFound(new { message = "Guest not found" });

            var userEmail = User.Identity?.Name;
            if (!await _weddingAuthorizationService.CanAccessWeddingAsync(userEmail!, guest.WeddingId))
                return Forbid();

            try
            {
                await _tableService.AssignGuestAsync(tableId, guestId);
                return Ok(new { message = "Guest assigned to table" });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // DELETE: api/table/assign/{guestId}
        [HttpDelete("assign/{guestId}")]
        [Authorize]
        public async Task<IActionResult> UnassignGuest(int guestId)
        {
            var guest = await _guestService.GetByIdAsync(guestId);
            if (guest == null)
                return NotFound(new { message = "Guest not found" });

            var userEmail = User.Identity?.Name;
            if (!await _weddingAuthorizationService.CanAccessWeddingAsync(userEmail!, guest.WeddingId))
                return Forbid();

            try
            {
                await _tableService.UnassignGuestAsync(guestId);
                return Ok(new { message = "Guest unassigned from table" });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }
    }
}
