using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WeddingInvite.Core.DTOs;
using WeddingInvite.Core.Services;

namespace WeddingInvite.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        // POST: api/auth/login
        [HttpPost("login")]
        public async Task<ActionResult<LoginResponseDto>> Login([FromBody] LoginDto loginDto)
        {
            try
            {
                var response = await _authService.LoginAsync(loginDto);

                // Set JWT token in HttpOnly cookie
                Response.Cookies.Append("token", response.Token, new CookieOptions
                {
                    HttpOnly = true,
                    // Secure = true, // Only over HTTPS
                    Secure = false, // Only over HTTP
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
        public async Task<ActionResult<LoginResponseDto>> RegisterCouple([FromBody] RegisterCoupleDto registerDto)
        {
            try
            {
                var response = await _authService.RegisterCoupleAsync(registerDto);

                // Set JWT token in HttpOnly cookie
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
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred during registration" });
            }
        }

        // POST: api/auth/create-couple-admin
        [HttpPost("create-couple-admin")]
        [Authorize(Roles = "SUPER_ADMIN")] // Only super admin can create couple accounts
        public async Task<ActionResult<UserDto>> CreateCoupleAdmin([FromBody] CreateCoupleAdminDto createDto)
        {
            try
            {
                var user = await _authService.CreateCoupleAdminForWeddingAsync(
                    createDto.WeddingId,
                    createDto.Email,
                    createDto.Password
                );

                return Ok(user);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // GET: api/auth/couple-admin/{weddingId}
        [HttpGet("couple-admin/{weddingId}")]
        [Authorize(Roles = "SUPER_ADMIN")]
        public async Task<ActionResult<UserDto>> GetCoupleAdmin(int weddingId)
        {
            var user = await _authService.GetCoupleAdminAsync(weddingId);
            if (user == null) return NotFound();
            return Ok(user);
        }

        // PATCH: api/auth/couple-admin/{userId}/active
        [HttpPatch("couple-admin/{userId}/active")]
        [Authorize(Roles = "SUPER_ADMIN")]
        public async Task<ActionResult<UserDto>> SetActive(int userId, [FromBody] SetActiveDto dto)
        {
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

        // PUT: api/auth/couple-admin/{userId}/reset-password
        [HttpPut("couple-admin/{userId}/reset-password")]
        [Authorize(Roles = "SUPER_ADMIN")]
        public async Task<IActionResult> ResetPassword(int userId, [FromBody] ResetPasswordDto dto)
        {
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
        [Authorize(Roles = "SUPER_ADMIN")]
        public async Task<IActionResult> DeleteUser(int userId)
        {
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

        // POST: api/auth/logout
        [HttpPost("logout")]
        public IActionResult Logout()
        {
            Response.Cookies.Delete("token");
            return Ok(new { message = "Logged out successfully" });
        }
    }
}