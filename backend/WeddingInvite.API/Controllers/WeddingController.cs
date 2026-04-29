using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WeddingInvite.Core.DTOs;
using WeddingInvite.Core.Services;

namespace WeddingInvite.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class WeddingController : ControllerBase
    {
        private readonly IWeddingService _weddingService;
        private readonly IWeddingAuthorizationService _authorizationService;

        public WeddingController(IWeddingService weddingService, IWeddingAuthorizationService authorizationService)
        {
            _weddingService = weddingService;
            _authorizationService = authorizationService;
        }

        // GET: api/wedding
        [HttpGet]
        [Authorize(Roles = "SUPER_ADMIN")]
        public async Task<ActionResult<IEnumerable<WeddingDto>>> GetAll()
        {
            var weddings = await _weddingService.GetAllAsync();
            return Ok(weddings);
        }

        // GET: api/wedding/5
        [HttpGet("{id}")]
        public async Task<ActionResult<WeddingDto>> GetById(int id)
        {
            var wedding = await _weddingService.GetByIdAsync(id);

            if (wedding == null)
                return NotFound(new { message = $"Wedding with ID {id} not found" });

            return Ok(wedding);
        }

        // GET: api/wedding/couple/john-and-mary
        [HttpGet("couple/{coupleName}")]
        public async Task<ActionResult<WeddingDto>> GetByCoupleName(string coupleName)
        {
            var wedding = await _weddingService.GetByCoupleNameAsync(coupleName);

            if (wedding == null)
                return NotFound(new { message = $"Wedding '{coupleName}' not found" });

            return Ok(wedding);
        }

        // POST: api/wedding
        [HttpPost]
        [Authorize(Roles = "SUPER_ADMIN")]

        public async Task<ActionResult<WeddingDto>> Create([FromBody] CreateWeddingDto createDto)
        {
            try
            {
                var wedding = await _weddingService.CreateAsync(createDto);

                // Return 201 Created with location header
                return CreatedAtAction(
                    nameof(GetById),
                    new { id = wedding.WeddingId },
                    wedding
                );
            }
            catch (ArgumentException ex)
            {
                // Business validation failed
                return BadRequest(new { message = ex.Message });
            }
        }

        // PUT: api/wedding/5
        [HttpPut("{id}")]
        [Authorize]
        public async Task<ActionResult<WeddingDto>> Update(int id, [FromBody] UpdateWeddingDto updateDto)
        {
            var userEmail = User.Identity?.Name;
            if (!await _authorizationService.CanAccessWeddingAsync(userEmail!, id))
                return Forbid();

            try
            {
                var wedding = await _weddingService.UpdateAsync(id, updateDto);
                return Ok(wedding);
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

        // PUT: api/wedding/5/toggle-active
        [HttpPut("{id}/toggle-active")]
        [Authorize(Roles = "SUPER_ADMIN")]

        public async Task<ActionResult<WeddingDto>> ToggleActive(
            int id,
            [FromBody] ToggleActiveDto toggleDto)
        {
            try
            {
                var wedding = await _weddingService.ToggleActiveAsync(id, toggleDto.IsActive);
                return Ok(wedding);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // DELETE: api/wedding/5
        [HttpDelete("{id}")]
        [Authorize(Roles = "SUPER_ADMIN")]

        public async Task<ActionResult> Delete(int id)
        {
            var result = await _weddingService.DeleteAsync(id);

            if (!result)
                return NotFound(new { message = $"Wedding with ID {id} not found" });

            return NoContent(); // 204 No Content (success, nothing to return)
        }

        [HttpPut("{id}/template")]
        [Authorize(Roles = "SUPER_ADMIN")]
        public async Task<ActionResult<WeddingDto>> UpdateTemplate(int id, [FromBody] UpdateTemplateDto dto)
        {
            try
            {
                var updated = await _weddingService.UpdateTemplateAsync(id, dto.TemplateId);
                return Ok(updated);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{id}/package")]
        [Authorize(Roles = "SUPER_ADMIN")]
        public async Task<ActionResult<WeddingDto>> UpdatePackage(int id, [FromBody] AssignPackageDto dto)
        {
            try
            {
                var updated = await _weddingService.UpdatePackageAsync(id, dto.PackageId);
                return Ok(updated);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}