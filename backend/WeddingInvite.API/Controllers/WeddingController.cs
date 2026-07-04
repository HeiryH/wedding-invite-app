using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WeddingInvite.Core.DTOs;
using WeddingInvite.Core.Services;
using WeddingInvite.Data.Repositories;
using WeddingInvite.Models;

namespace WeddingInvite.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class WeddingController : ControllerBase
    {
        private readonly IWeddingService _weddingService;
        private readonly IWeddingAuthorizationService _authorizationService;
        private readonly IUserRepository _userRepo;

        public WeddingController(
            IWeddingService weddingService,
            IWeddingAuthorizationService authorizationService,
            IUserRepository userRepo)
        {
            _weddingService = weddingService;
            _authorizationService = authorizationService;
            _userRepo = userRepo;
        }

        // GET: api/wedding — super admin only, returns all weddings with creator info for grouping
        [HttpGet]
        [Authorize(Roles = "SUPER_ADMIN")]
        public async Task<ActionResult<IEnumerable<WeddingDto>>> GetAll()
        {
            var weddings = await _weddingService.GetAllAsync();
            return Ok(weddings);
        }

        // GET: api/wedding/mine — host admin only, returns their own weddings
        [HttpGet("mine")]
        [Authorize(Roles = "HOST_ADMIN")]
        public async Task<ActionResult<IEnumerable<WeddingDto>>> GetMine()
        {
            var userEmail = User.Identity?.Name;
            var user = await _userRepo.GetByEmailAsync(userEmail!);
            if (user == null) return Forbid();

            var weddings = await _weddingService.GetByCreatorAsync(user.UserId);
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
        [Authorize(Roles = "SUPER_ADMIN,HOST_ADMIN")]
        public async Task<ActionResult<WeddingDto>> Create([FromBody] CreateWeddingDto createDto)
        {
            try
            {
                int? createdByUserId = null;
                if (User.IsInRole(UserRoles.HostAdmin))
                {
                    var userEmail = User.Identity?.Name;
                    var user = await _userRepo.GetByEmailAsync(userEmail!);
                    createdByUserId = user?.UserId;
                }

                var wedding = await _weddingService.CreateAsync(createDto, createdByUserId);

                return CreatedAtAction(
                    nameof(GetById),
                    new { id = wedding.WeddingId },
                    wedding
                );
            }
            catch (ArgumentException ex)
            {
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
        [Authorize(Roles = "SUPER_ADMIN,HOST_ADMIN")]
        public async Task<ActionResult<WeddingDto>> ToggleActive(int id, [FromBody] ToggleActiveDto toggleDto)
        {
            var userEmail = User.Identity?.Name;
            if (!await _authorizationService.CanAccessWeddingAsync(userEmail!, id))
                return Forbid();

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

        // PUT: api/wedding/5/toggle-rsvp
        [HttpPut("{id}/toggle-rsvp")]
        [Authorize]
        public async Task<ActionResult<WeddingDto>> ToggleRsvp(int id, [FromBody] ToggleRsvpDto toggleDto)
        {
            var userEmail = User.Identity?.Name;
            if (!await _authorizationService.CanAccessWeddingAsync(userEmail!, id))
                return Forbid();

            try
            {
                var wedding = await _weddingService.ToggleRsvpAsync(id, toggleDto.IsRsvpOpen);
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
        [Authorize(Roles = "SUPER_ADMIN,HOST_ADMIN")]
        public async Task<ActionResult> Delete(int id)
        {
            var userEmail = User.Identity?.Name;
            if (!await _authorizationService.CanAccessWeddingAsync(userEmail!, id))
                return Forbid();

            var result = await _weddingService.DeleteAsync(id);

            if (!result)
                return NotFound(new { message = $"Wedding with ID {id} not found" });

            return NoContent();
        }

        [HttpPut("{id}/template")]
        [Authorize(Roles = "SUPER_ADMIN,HOST_ADMIN,COUPLE_ADMIN")]
        public async Task<ActionResult<WeddingDto>> UpdateTemplate(int id, [FromBody] UpdateTemplateDto dto)
        {
            var userEmail = User.Identity?.Name;
            if (!await _authorizationService.CanAccessWeddingAsync(userEmail!, id))
                return Forbid();

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
        [Authorize(Roles = "SUPER_ADMIN,HOST_ADMIN")]
        public async Task<ActionResult<WeddingDto>> UpdatePackage(int id, [FromBody] AssignPackageDto dto)
        {
            var userEmail = User.Identity?.Name;
            if (!await _authorizationService.CanAccessWeddingAsync(userEmail!, id))
                return Forbid();

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

        // DELETE: api/wedding/stale-private?daysOld=30
        [HttpDelete("stale-private")]
        [Authorize(Roles = "SUPER_ADMIN")]
        public async Task<ActionResult> PruneStalePrivate([FromQuery] int daysOld = 30)
        {
            if (daysOld < 1) return BadRequest(new { message = "daysOld must be at least 1" });
            var count = await _weddingService.PruneStalePrivateAsync(daysOld);
            return Ok(new { deleted = count, message = $"Pruned {count} stale private wedding(s) older than {daysOld} days." });
        }
    }
}
