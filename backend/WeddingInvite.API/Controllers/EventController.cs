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
    public class EventController : ControllerBase
    {
        private readonly IEventService _eventService;
        private readonly IEventAuthorizationService _authorizationService;
        private readonly IUserRepository _userRepo;
        private readonly IEventExportService _eventExportService;

        public EventController(
            IEventService eventService,
            IEventAuthorizationService authorizationService,
            IUserRepository userRepo,
            IEventExportService eventExportService)
        {
            _eventService = eventService;
            _authorizationService = authorizationService;
            _userRepo = userRepo;
            _eventExportService = eventExportService;
        }

        // GET: api/event — super admin only, returns all events with creator info for grouping
        [HttpGet]
        [Authorize(Roles = "SUPER_ADMIN")]
        public async Task<ActionResult<IEnumerable<EventDto>>> GetAll()
        {
            var events = await _eventService.GetAllAsync();
            return Ok(events);
        }

        // GET: api/event/mine — host admin only, returns their own events
        [HttpGet("mine")]
        [Authorize(Roles = "HOST_ADMIN")]
        public async Task<ActionResult<IEnumerable<EventDto>>> GetMine()
        {
            var userEmail = User.Identity?.Name;
            var user = await _userRepo.GetByEmailAsync(userEmail!);
            if (user == null) return Forbid();

            var events = await _eventService.GetByCreatorAsync(user.UserId);
            return Ok(events);
        }

        // GET: api/event/5
        [HttpGet("{id}")]
        public async Task<ActionResult<EventDto>> GetById(int id)
        {
            var evt = await _eventService.GetByIdAsync(id);

            if (evt == null)
                return NotFound(new { message = $"Event with ID {id} not found" });

            return Ok(evt);
        }

        // GET: api/event/slug/john-and-mary
        [HttpGet("slug/{slug}")]
        public async Task<ActionResult<EventDto>> GetBySlug(string slug)
        {
            var evt = await _eventService.GetBySlugAsync(slug);

            if (evt == null)
                return NotFound(new { message = $"Event '{slug}' not found" });

            return Ok(evt);
        }

        // POST: api/event
        [HttpPost]
        [Authorize(Roles = "SUPER_ADMIN,HOST_ADMIN")]
        public async Task<ActionResult<EventDto>> Create([FromBody] CreateEventDto createDto)
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

                var evt = await _eventService.CreateAsync(createDto, createdByUserId);

                return CreatedAtAction(
                    nameof(GetById),
                    new { id = evt.EventId },
                    evt
                );
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // PUT: api/event/5
        [HttpPut("{id}")]
        [Authorize]
        public async Task<ActionResult<EventDto>> Update(int id, [FromBody] UpdateEventDto updateDto)
        {
            var userEmail = User.Identity?.Name;
            if (!await _authorizationService.CanAccessEventAsync(userEmail!, id))
                return Forbid();

            try
            {
                var evt = await _eventService.UpdateAsync(id, updateDto);
                return Ok(evt);
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

        // PUT: api/event/5/toggle-active
        [HttpPut("{id}/toggle-active")]
        [Authorize(Roles = "SUPER_ADMIN,HOST_ADMIN")]
        public async Task<ActionResult<EventDto>> ToggleActive(int id, [FromBody] ToggleActiveDto toggleDto)
        {
            var userEmail = User.Identity?.Name;
            if (!await _authorizationService.CanAccessEventAsync(userEmail!, id))
                return Forbid();

            try
            {
                var evt = await _eventService.ToggleActiveAsync(id, toggleDto.IsActive);
                return Ok(evt);
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

        // PUT: api/event/5/toggle-rsvp
        [HttpPut("{id}/toggle-rsvp")]
        [Authorize]
        public async Task<ActionResult<EventDto>> ToggleRsvp(int id, [FromBody] ToggleRsvpDto toggleDto)
        {
            var userEmail = User.Identity?.Name;
            if (!await _authorizationService.CanAccessEventAsync(userEmail!, id))
                return Forbid();

            try
            {
                var evt = await _eventService.ToggleRsvpAsync(id, toggleDto.IsRsvpOpen);
                return Ok(evt);
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

        // PUT: api/event/5/domain  (set or clear a custom domain — PRO tier)
        [HttpPut("{id}/domain")]
        [Authorize]
        public async Task<ActionResult<EventDto>> SetDomain(int id, [FromBody] SetDomainDto dto)
        {
            var userEmail = User.Identity?.Name;
            if (!await _authorizationService.CanAccessEventAsync(userEmail!, id))
                return Forbid();

            try
            {
                var evt = await _eventService.SetDomainAsync(id, dto.Domain);
                return Ok(evt);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                // InvalidOperationException (tier) + ArgumentException (format/taken) → 400
                return BadRequest(new { message = ex.Message });
            }
        }

        // GET: api/event/by-domain?domain=john-and-mary.com  (public — host resolution)
        [HttpGet("by-domain")]
        [AllowAnonymous]
        public async Task<ActionResult<EventDto>> GetByDomain([FromQuery] string domain)
        {
            if (string.IsNullOrWhiteSpace(domain))
                return BadRequest(new { message = "domain is required" });

            var evt = await _eventService.GetByDomainAsync(domain);
            if (evt == null)
                return NotFound(new { message = "No event is mapped to that domain" });

            return Ok(evt);
        }

        // DELETE: api/event/5
        [HttpDelete("{id}")]
        [Authorize(Roles = "SUPER_ADMIN,HOST_ADMIN")]
        public async Task<ActionResult> Delete(int id)
        {
            var userEmail = User.Identity?.Name;
            if (!await _authorizationService.CanAccessEventAsync(userEmail!, id))
                return Forbid();

            var result = await _eventService.DeleteAsync(id);

            if (!result)
                return NotFound(new { message = $"Event with ID {id} not found" });

            return NoContent();
        }

        // GET: api/event/5/export — a zip of everything belonging to this event (RSVPs, wishes,
        // seating, itinerary, full customization config, photos, audio). Same role/access gate as
        // Delete — pairs naturally as "back this up before you remove it," but stands on its own too.
        [HttpGet("{id}/export")]
        [Authorize(Roles = "SUPER_ADMIN,HOST_ADMIN")]
        public async Task<IActionResult> Export(int id)
        {
            var userEmail = User.Identity?.Name;
            if (!await _authorizationService.CanAccessEventAsync(userEmail!, id))
                return Forbid();

            var evt = await _eventService.GetByIdAsync(id);
            if (evt == null)
                return NotFound(new { message = $"Event with ID {id} not found" });

            var zipBytes = await _eventExportService.BuildExportZipAsync(id);
            if (zipBytes == null)
                return NotFound(new { message = $"Event with ID {id} not found" });

            var filename = $"{evt.Slug}-export-{DateTime.UtcNow:yyyy-MM-dd}.zip";
            return File(zipBytes, "application/zip", filename);
        }

        [HttpPut("{id}/template")]
        [Authorize(Roles = "SUPER_ADMIN,HOST_ADMIN,ORGANIZER_ADMIN")]
        public async Task<ActionResult<EventDto>> UpdateTemplate(int id, [FromBody] UpdateTemplateDto dto)
        {
            var userEmail = User.Identity?.Name;
            if (!await _authorizationService.CanAccessEventAsync(userEmail!, id))
                return Forbid();

            try
            {
                var updated = await _eventService.UpdateTemplateAsync(id, dto.TemplateId);
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

        // DELETE: api/event/stale-private?daysOld=30
        [HttpDelete("stale-private")]
        [Authorize(Roles = "SUPER_ADMIN")]
        public async Task<ActionResult> PruneStalePrivate([FromQuery] int daysOld = 30)
        {
            if (daysOld < 1) return BadRequest(new { message = "daysOld must be at least 1" });
            var count = await _eventService.PruneStalePrivateAsync(daysOld);
            return Ok(new { deleted = count, message = $"Pruned {count} stale private event(s) older than {daysOld} days." });
        }
    }
}
