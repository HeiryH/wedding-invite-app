using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using WeddingInvite.Core.DTOs;
using WeddingInvite.Core.Services;
using WeddingInvite.Core.Utilities;
using WeddingInvite.Models;

namespace WeddingInvite.API.Controllers
{
    [ApiController]
    [Route("api/landing")]
    public class LandingController : ControllerBase
    {
        private readonly ILandingService _service;
        private readonly IWebHostEnvironment _env;
        private const long MaxImageBytes = 10 * 1024 * 1024;
        private static readonly string[] AllowedExtensions = { ".jpg", ".jpeg", ".png", ".gif", ".webp" };

        public LandingController(ILandingService service, IWebHostEnvironment env)
        {
            _service = service;
            _env = env;
        }

        // GET: api/landing (public — the whole composed payload)
        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<LandingDto>> Get() => Ok(await _service.GetAsync());

        // PUT: api/landing/content (whole-bag scalar content)
        [HttpPut("content")]
        [Authorize(Roles = UserRoles.SuperAdmin)]
        public async Task<IActionResult> SaveContent([FromBody] SaveLandingContentDto dto)
        {
            await _service.SaveContentAsync(dto.Content);
            return Ok(new { message = "Saved" });
        }

        // PUT: api/landing/section (upsert a section's order/visibility)
        [HttpPut("section")]
        [Authorize(Roles = UserRoles.SuperAdmin)]
        public async Task<ActionResult<LandingSectionDto>> UpsertSection([FromBody] UpsertLandingSectionDto dto)
            => Ok(await _service.UpsertSectionAsync(dto));

        // POST: api/landing/item
        [HttpPost("item")]
        [Authorize(Roles = UserRoles.SuperAdmin)]
        public async Task<ActionResult<LandingItemDto>> CreateItem([FromBody] UpsertLandingItemDto dto)
            => Ok(await _service.CreateItemAsync(dto));

        // PUT: api/landing/item/{id}
        [HttpPut("item/{id:int}")]
        [Authorize(Roles = UserRoles.SuperAdmin)]
        public async Task<ActionResult<LandingItemDto>> UpdateItem(int id, [FromBody] UpsertLandingItemDto dto)
        {
            var updated = await _service.UpdateItemAsync(id, dto);
            return updated == null ? NotFound() : Ok(updated);
        }

        // DELETE: api/landing/item/{id}
        [HttpDelete("item/{id:int}")]
        [Authorize(Roles = UserRoles.SuperAdmin)]
        public async Task<IActionResult> DeleteItem(int id)
            => await _service.DeleteItemAsync(id) ? NoContent() : NotFound();

        // POST: api/landing/image (super-admin image upload → /uploads/landing/…)
        [HttpPost("image")]
        [Authorize(Roles = UserRoles.SuperAdmin)]
        [EnableRateLimiting("public-upload")]
        public async Task<IActionResult> UploadImage([FromForm] IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "Image file is required" });
            if (file.Length > MaxImageBytes)
                return BadRequest(new { message = $"File size cannot exceed {MaxImageBytes / 1024 / 1024}MB" });

            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!AllowedExtensions.Contains(extension))
                return BadRequest(new { message = $"Only {string.Join(", ", AllowedExtensions)} files are allowed" });
            if (!file.ContentType.StartsWith("image/"))
                return BadRequest(new { message = "Only image files are allowed" });
            if (!FileSignatureValidator.IsValidImage(file, extension))
                return BadRequest(new { message = "File content does not match a valid image format" });

            var webRoot = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            var folder = Path.Combine(webRoot, "uploads", "landing");
            Directory.CreateDirectory(folder);

            var fileName = $"{Guid.NewGuid()}{extension}";
            var path = Path.Combine(folder, fileName);
            using (var stream = new FileStream(path, FileMode.Create))
                await file.CopyToAsync(stream);

            return Ok(new { url = $"/uploads/landing/{fileName}" });
        }
    }
}
