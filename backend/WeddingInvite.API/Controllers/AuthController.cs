using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using WeddingInvite.Core.DTOs;
using WeddingInvite.Core.Services;
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
        private readonly IWeddingRepository _weddingRepo;

        public AuthController(IAuthService authService, IUserRepository userRepo, IWeddingRepository weddingRepo)
        {
            _authService = authService;
            _userRepo = userRepo;
            _weddingRepo = weddingRepo;
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

        // ── Couple-admin account management ──────────────────────────────────
        // Super admin: any wedding. Host admin: only their own weddings.

        // POST: api/auth/create-couple-admin
        [HttpPost("create-couple-admin")]
        [Authorize(Roles = "SUPER_ADMIN,HOST_ADMIN")]
        public async Task<ActionResult<UserDto>> CreateCoupleAdmin([FromBody] CreateCoupleAdminDto createDto)
        {
            if (User.IsInRole(UserRoles.HostAdmin))
            {
                if (!await HostOwnsWeddingAsync(createDto.WeddingId))
                    return Forbid();
            }

            try
            {
                var user = await _authService.CreateCoupleAdminForWeddingAsync(
                    createDto.WeddingId, createDto.Email, createDto.Password);
                return Ok(user);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // GET: api/auth/couple-admin/{weddingId}
        [HttpGet("couple-admin/{weddingId}")]
        [Authorize(Roles = "SUPER_ADMIN,HOST_ADMIN")]
        public async Task<ActionResult<UserDto>> GetCoupleAdmin(int weddingId)
        {
            if (User.IsInRole(UserRoles.HostAdmin))
            {
                if (!await HostOwnsWeddingAsync(weddingId))
                    return Forbid();
            }

            var user = await _authService.GetCoupleAdminAsync(weddingId);
            if (user == null) return NotFound();
            return Ok(user);
        }

        // PATCH: api/auth/couple-admin/{userId}/active
        [HttpPatch("couple-admin/{userId}/active")]
        [Authorize(Roles = "SUPER_ADMIN,HOST_ADMIN")]
        public async Task<ActionResult<UserDto>> SetActive(int userId, [FromBody] SetActiveDto dto)
        {
            if (User.IsInRole(UserRoles.HostAdmin))
            {
                if (!await HostOwnsCoupleAdminAsync(userId))
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

        // PATCH: api/auth/couple-admin/{userId}/tier
        [HttpPatch("couple-admin/{userId}/tier")]
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

        // PUT: api/auth/couple-admin/{userId}/reset-password
        [HttpPut("couple-admin/{userId}/reset-password")]
        [Authorize(Roles = "SUPER_ADMIN,HOST_ADMIN")]
        public async Task<IActionResult> ResetPassword(int userId, [FromBody] ResetPasswordDto dto)
        {
            if (User.IsInRole(UserRoles.HostAdmin))
            {
                if (!await HostOwnsCoupleAdminAsync(userId))
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

        // DELETE: api/auth/couple-admin/{userId}
        [HttpDelete("couple-admin/{userId}")]
        [Authorize(Roles = "SUPER_ADMIN,HOST_ADMIN")]
        public async Task<IActionResult> DeleteUser(int userId)
        {
            if (User.IsInRole(UserRoles.HostAdmin))
            {
                if (!await HostOwnsCoupleAdminAsync(userId))
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
                // Parse wedding date (default to 6 months from now if missing/invalid)
                if (!DateTime.TryParse(dto.WeddingDate, out var weddingDate) || weddingDate < DateTime.UtcNow)
                    weddingDate = DateTime.UtcNow.AddMonths(6);

                // Generate a unique couple-name slug
                var baseSlug = GenerateSelfSlug(dto.BrideName, dto.GroomName);
                var slug = baseSlug;
                var suffix = 2;
                while (await _weddingRepo.CoupleNameExistsAsync(slug))
                    slug = $"{baseSlug}-{suffix++}";

                // Create the wedding
                var wedding = new Wedding
                {
                    CoupleName    = slug,
                    BrideName     = dto.BrideName.Trim(),
                    GroomName     = dto.GroomName.Trim(),
                    WeddingDate   = weddingDate,
                    Venue         = string.IsNullOrWhiteSpace(dto.Venue) ? "TBD" : dto.Venue.Trim(),
                    VenueAddress  = dto.VenueAddress?.Trim() ?? string.Empty,
                    TemplateId    = dto.TemplateId > 0 ? dto.TemplateId : 1,
                    IsActive      = true,
                    IsPublic      = false,
                    CreatedDate   = DateTime.UtcNow,
                };
                var createdWedding = await _weddingRepo.CreateAsync(wedding);

                // Create the couple-admin account
                var user = await _authService.CreateCoupleAdminForWeddingAsync(
                    createdWedding.WeddingId, dto.Email.Trim().ToLower(), dto.Password);

                var token = _authService.GenerateJwtToken(user.Email, user.Role, user.WeddingId);

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
                    WeddingId = user.WeddingId,
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

        // ── Ownership helpers ──────────────────────────────────────────────────

        private static string GenerateSelfSlug(string brideName, string groomName)
        {
            static string First(string name) =>
                new string(name.Trim().Split(' ')[0].ToLower()
                    .Where(c => char.IsLetterOrDigit(c)).ToArray());
            var b = First(brideName);
            var g = First(groomName);
            if (string.IsNullOrEmpty(b)) b = "bride";
            if (string.IsNullOrEmpty(g)) g = "groom";
            return $"{b}-and-{g}";
        }

        private async Task<bool> HostOwnsWeddingAsync(int weddingId)
        {
            var userEmail = User.Identity?.Name;
            var host = await _userRepo.GetByEmailAsync(userEmail!);
            if (host == null) return false;

            var wedding = await _weddingRepo.GetByIdAsync(weddingId);
            return wedding?.CreatedByUserId == host.UserId;
        }

        private async Task<bool> HostOwnsCoupleAdminAsync(int coupleAdminUserId)
        {
            var target = await _userRepo.GetByIdAsync(coupleAdminUserId);
            if (target?.WeddingId == null) return false;
            return await HostOwnsWeddingAsync(target.WeddingId.Value);
        }
    }
}
