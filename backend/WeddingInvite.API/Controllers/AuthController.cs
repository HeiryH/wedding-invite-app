using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using WeddingInvite.Core.DTOs;
using WeddingInvite.Core.Services;
using WeddingInvite.Core.Utilities;
using WeddingInvite.Data.Repositories;
using WeddingInvite.Models;

namespace WeddingInvite.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly IUserRepository _userRepo;
        private readonly IEventRepository _eventRepo;
        private readonly ITemplateRepository _templateRepo;
        private readonly IGuestService _guestService;
        private readonly IWishService _wishService;
        private readonly ITemplateConfigService _configService;
        private readonly IItineraryService _itineraryService;
        private readonly ILogger<AuthController> _logger;

        public AuthController(
            IAuthService authService,
            IUserRepository userRepo,
            IEventRepository eventRepo,
            ITemplateRepository templateRepo,
            IGuestService guestService,
            IWishService wishService,
            ITemplateConfigService configService,
            IItineraryService itineraryService,
            ILogger<AuthController> logger)
        {
            _authService = authService;
            _userRepo = userRepo;
            _eventRepo = eventRepo;
            _templateRepo = templateRepo;
            _guestService = guestService;
            _wishService = wishService;
            _configService = configService;
            _itineraryService = itineraryService;
            _logger = logger;
        }

        // POST: api/auth/login
        [HttpPost("login")]
        [EnableRateLimiting("auth")]
        public async Task<ActionResult<LoginResponseDto>> Login([FromBody] LoginDto loginDto)
        {
            try
            {
                var response = await _authService.LoginAsync(loginDto);

                Response.Cookies.Append("token", response.Token, new CookieOptions
                {
                    HttpOnly = true,
                    Secure = false,
                    SameSite = SameSiteMode.Lax,
                    Expires = DateTime.UtcNow.AddDays(1),
                    Path = "/"
                });

                return Ok(response);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // POST: api/auth/register-couple
        [HttpPost("register-couple")]
        [EnableRateLimiting("auth")]
        public async Task<ActionResult<LoginResponseDto>> RegisterCouple([FromBody] RegisterCoupleDto registerDto)
        {
            try
            {
                var response = await _authService.RegisterCoupleAsync(registerDto);

                Response.Cookies.Append("token", response.Token, new CookieOptions
                {
                    HttpOnly = true,
                    Secure = true,
                    SameSite = SameSiteMode.Strict,
                    Expires = DateTime.UtcNow.AddDays(1)
                });

                return Ok(response);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception)
            {
                return StatusCode(500, new { message = "An error occurred during registration" });
            }
        }

        // ── Organizer-admin account management ────────────────────────────────
        // Super admin: any wedding. Host admin: only their own weddings.

        // POST: api/auth/create-organizer-admin
        [HttpPost("create-organizer-admin")]
        [Authorize(Roles = "SUPER_ADMIN,HOST_ADMIN")]
        public async Task<ActionResult<UserDto>> CreateOrganizerAdmin([FromBody] CreateOrganizerAdminDto createDto)
        {
            if (User.IsInRole(UserRoles.HostAdmin))
            {
                if (!await HostOwnsEventAsync(createDto.EventId))
                    return Forbid();
            }

            try
            {
                var user = await _authService.CreateOrganizerAdminForEventAsync(
                    createDto.EventId, createDto.Email, createDto.Password);
                return Ok(user);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // GET: api/auth/organizer-admin/{eventId}
        [HttpGet("organizer-admin/{eventId}")]
        [Authorize(Roles = "SUPER_ADMIN,HOST_ADMIN")]
        public async Task<ActionResult<UserDto>> GetOrganizerAdmin(int eventId)
        {
            if (User.IsInRole(UserRoles.HostAdmin))
            {
                if (!await HostOwnsEventAsync(eventId))
                    return Forbid();
            }

            var user = await _authService.GetOrganizerAdminAsync(eventId);
            if (user == null) return NotFound();
            return Ok(user);
        }

        // PATCH: api/auth/organizer-admin/{userId}/active
        [HttpPatch("organizer-admin/{userId}/active")]
        [Authorize(Roles = "SUPER_ADMIN,HOST_ADMIN")]
        public async Task<ActionResult<UserDto>> SetActive(int userId, [FromBody] SetActiveDto dto)
        {
            if (User.IsInRole(UserRoles.HostAdmin))
            {
                if (!await HostOwnsOrganizerAdminAsync(userId))
                    return Forbid();
            }

            try
            {
                var user = await _authService.SetActiveAsync(userId, dto.IsActive);
                return Ok(user);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        // PATCH: api/auth/organizer-admin/{userId}/tier
        [HttpPatch("organizer-admin/{userId}/tier")]
        [Authorize(Roles = "SUPER_ADMIN")]
        public async Task<ActionResult<UserDto>> SetTier(int userId, [FromBody] SetTierDto dto)
        {
            try
            {
                var user = await _authService.SetTierAsync(userId, dto.Tier);
                return Ok(user);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        // PUT: api/auth/organizer-admin/{userId}/reset-password
        [HttpPut("organizer-admin/{userId}/reset-password")]
        [Authorize(Roles = "SUPER_ADMIN,HOST_ADMIN")]
        public async Task<IActionResult> ResetPassword(int userId, [FromBody] ResetPasswordDto dto)
        {
            if (User.IsInRole(UserRoles.HostAdmin))
            {
                if (!await HostOwnsOrganizerAdminAsync(userId))
                    return Forbid();
            }

            try
            {
                await _authService.ResetPasswordAsync(userId, dto.NewPassword);
                return Ok(new { message = "Password updated" });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        // DELETE: api/auth/organizer-admin/{userId}
        [HttpDelete("organizer-admin/{userId}")]
        [Authorize(Roles = "SUPER_ADMIN,HOST_ADMIN")]
        public async Task<IActionResult> DeleteUser(int userId)
        {
            if (User.IsInRole(UserRoles.HostAdmin))
            {
                if (!await HostOwnsOrganizerAdminAsync(userId))
                    return Forbid();
            }

            try
            {
                await _authService.DeleteUserAsync(userId);
                return NoContent();
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        // ── Host-admin account management (SUPER_ADMIN only) ─────────────────

        // POST: api/auth/create-host-admin
        [HttpPost("create-host-admin")]
        [Authorize(Roles = "SUPER_ADMIN")]
        public async Task<ActionResult<UserDto>> CreateHostAdmin([FromBody] CreateHostAdminDto dto)
        {
            try
            {
                var user = await _authService.CreateHostAdminAsync(dto.Email, dto.Password);
                return Ok(user);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // GET: api/auth/host-admins
        [HttpGet("host-admins")]
        [Authorize(Roles = "SUPER_ADMIN")]
        public async Task<ActionResult<IEnumerable<UserDto>>> GetHostAdmins()
        {
            var hosts = await _authService.GetAllHostAdminsAsync();
            return Ok(hosts);
        }

        // POST: api/auth/self-register  (public — anonymous user creates own account)
        [HttpPost("self-register")]
        [AllowAnonymous]
        [EnableRateLimiting("auth")]
        public async Task<ActionResult<LoginResponseDto>> SelfRegister([FromBody] SelfRegisterDto dto)
        {
            try
            {
                // Parse event date (default to 6 months from now if missing/invalid)
                if (!DateTime.TryParse(dto.EventDate, out var eventDate) || eventDate < DateTime.UtcNow)
                    eventDate = DateTime.UtcNow.AddMonths(6);

                var eventType = string.IsNullOrWhiteSpace(dto.EventType)
                    ? EventTypes.Wedding
                    : dto.EventType.ToUpperInvariant();

                // Same naming validation EventService.CreateAsync applies — self-register builds
                // its own Event (to keep it private-by-default, see IsPublic below) rather than
                // calling through EventService, so it needs its own copy of this gate.
                if (!EventNaming.HasRequiredNaming(eventType, dto.Name1, dto.Name2, dto.EventTitle))
                {
                    var message = eventType switch
                    {
                        EventTypes.Wedding => "Both names are required for a wedding",
                        EventTypes.Party => "A name is required",
                        EventTypes.Ceremony => "An event title is required",
                        _ => "Naming details are required",
                    };
                    return BadRequest(new { message });
                }

                // Same template/event-type gate EventService.CreateAsync applies — without this a
                // self-serve user could pick a PARTY template for a WEDDING event (or vice versa).
                var templateId = dto.TemplateId > 0 ? dto.TemplateId : 1;
                var chosenTemplate = await _templateRepo.GetByIdAsync(templateId);
                if (chosenTemplate == null)
                    return BadRequest(new { message = "Invalid template ID" });
                if (!TemplateEventGate.Supports(chosenTemplate.EventTypes, eventType))
                    return BadRequest(new { message = $"The '{chosenTemplate.TemplateName}' template doesn't support {eventType} events." });

                // Generate a unique slug via the shared, type-aware SlugGenerator (replacing the old
                // per-controller, WEDDING-only GenerateSelfSlug implementation).
                var baseSlug = SlugGenerator.GenerateBaseSlug(eventType, dto.Name1, dto.Name2, dto.EventTitle);
                var slug = baseSlug;
                var suffix = 2;
                while (await _eventRepo.SlugExistsAsync(slug))
                    slug = $"{baseSlug}-{suffix++}";

                // Create the event
                var evt = new Event
                {
                    Slug          = slug,
                    EventType     = eventType,
                    Name1         = dto.Name1?.Trim(),
                    Name2         = dto.Name2?.Trim(),
                    EventTitle    = dto.EventTitle?.Trim(),
                    EventDate     = eventDate,
                    Venue         = string.IsNullOrWhiteSpace(dto.Venue) ? "TBD" : dto.Venue.Trim(),
                    VenueAddress  = dto.VenueAddress?.Trim() ?? string.Empty,
                    TemplateId    = templateId,
                    IsActive      = true,
                    IsPublic      = false,
                    CreatedDate   = DateTime.UtcNow,
                };
                var createdEvent = await _eventRepo.CreateAsync(evt);

                // Carry through any guest-personalised content. Best-effort: a bad
                // config or itinerary row must never block account creation. The
                // config service applies the same BASIC-tier write policy as the
                // customize page, so PRO/adminOnly keys are silently dropped.
                if (dto.Config is { Count: > 0 })
                {
                    try
                    {
                        await _configService.SaveConfigAsync(
                            createdEvent.EventId, dto.Config, UserRoles.OrganizerAdmin, "BASIC");
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "self-register: failed to save guest config for event {EventId}", createdEvent.EventId);
                    }
                }

                if (dto.Itinerary is { Count: > 0 })
                {
                    var index = 0;
                    foreach (var item in dto.Itinerary)
                    {
                        if (string.IsNullOrWhiteSpace(item.Label) && string.IsNullOrWhiteSpace(item.Detail)) continue;
                        try
                        {
                            await _itineraryService.CreateAsync(createdEvent.EventId, new CreateItineraryItemDto
                            {
                                Label = item.Label,
                                Detail = item.Detail,
                                SortOrder = index++,
                            });
                        }
                        catch (Exception ex)
                        {
                            _logger.LogWarning(ex, "self-register: failed to save itinerary row for event {EventId}", createdEvent.EventId);
                        }
                    }
                }

                // Create the organizer-admin account
                var user = await _authService.CreateOrganizerAdminForEventAsync(
                    createdEvent.EventId, dto.Email.Trim().ToLower(), dto.Password);

                var token = _authService.GenerateJwtToken(user.Email, user.Role, user.EventId);

                Response.Cookies.Append("token", token, new CookieOptions
                {
                    HttpOnly = true,
                    Secure   = false,
                    SameSite = SameSiteMode.Lax,
                    Expires  = DateTime.UtcNow.AddDays(1),
                    Path     = "/",
                });

                return Ok(new LoginResponseDto
                {
                    Token     = token,
                    Email     = user.Email,
                    Role      = user.Role,
                    EventId   = user.EventId,
                    Tier      = user.Tier,
                });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception)
            {
                return StatusCode(500, new { message = "Registration failed. Please try again." });
            }
        }

        // POST: api/auth/logout
        [HttpPost("logout")]
        public IActionResult Logout()
        {
            Response.Cookies.Delete("token");
            return Ok(new { message = "Logged out successfully" });
        }

        // GET: api/auth/me/export  (GDPR — the signed-in user downloads their own data)
        [HttpGet("me/export")]
        [Authorize]
        public async Task<IActionResult> ExportMyData()
        {
            var email = User.Identity?.Name;
            var user = string.IsNullOrEmpty(email) ? null : await _userRepo.GetByEmailAsync(email);
            if (user == null) return Unauthorized();

            object? evt = null;
            object guests = Array.Empty<object>();
            object wishes = Array.Empty<object>();

            if (user.EventId is int wid)
            {
                evt = await _eventRepo.GetByIdAsync(wid);
                guests = await _guestService.GetByEventIdAsync(wid);
                wishes = await _wishService.GetByEventIdAsync(wid);
            }

            var export = new
            {
                exportedAt = DateTime.UtcNow,
                account = new { user.Email, user.Role, user.Tier, user.CreatedDate },
                wedding = evt,
                guests,
                wishes,
            };

            Response.Headers["Content-Disposition"] = "attachment; filename=my-data.json";
            return Ok(export);
        }

        // POST: api/auth/forgot-password  (public — emails a reset link)
        [HttpPost("forgot-password")]
        [AllowAnonymous]
        [EnableRateLimiting("auth")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
        {
            // Build the reset link against the request origin so it works in any environment.
            var origin = Request.Headers.Origin.FirstOrDefault()
                         ?? $"{Request.Scheme}://{Request.Host}";
            await _authService.RequestPasswordResetAsync(dto.Email.Trim().ToLower(), $"{origin}/reset-password");
            // Always 200 — never reveal whether the email is registered.
            return Ok(new { message = "If that email is registered, a reset link has been sent." });
        }

        // POST: api/auth/reset-password  (public — completes reset with a token)
        [HttpPost("reset-password")]
        [AllowAnonymous]
        [EnableRateLimiting("auth")]
        public async Task<IActionResult> ResetPasswordWithToken([FromBody] ResetPasswordWithTokenDto dto)
        {
            try
            {
                await _authService.ResetPasswordWithTokenAsync(dto.Token, dto.NewPassword);
                return Ok(new { message = "Your password has been reset. You can now log in." });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // ── Ownership helpers ──────────────────────────────────────────────────

        private async Task<bool> HostOwnsEventAsync(int eventId)
        {
            var userEmail = User.Identity?.Name;
            var host = await _userRepo.GetByEmailAsync(userEmail!);
            if (host == null) return false;

            var evt = await _eventRepo.GetByIdAsync(eventId);
            return evt?.CreatedByUserId == host.UserId;
        }

        private async Task<bool> HostOwnsOrganizerAdminAsync(int organizerAdminUserId)
        {
            var target = await _userRepo.GetByIdAsync(organizerAdminUserId);
            if (target?.EventId == null) return false;
            return await HostOwnsEventAsync(target.EventId.Value);
        }
    }
}
