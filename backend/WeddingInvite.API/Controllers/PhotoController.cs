using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using WeddingInvite.Core.DTOs;
using WeddingInvite.Core.Services;

namespace WeddingInvite.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PhotoController : ControllerBase
    {
        private readonly IPhotoService _photoService;
        private readonly IEventAuthorizationService _eventAuthorizationService; // ✅ USE SERVICE, NOT REPO

        public PhotoController(
            IPhotoService photoService,
            IEventAuthorizationService eventAuthorizationService) // ✅ INJECT SERVICE
        {
            _photoService = photoService;
            _eventAuthorizationService = eventAuthorizationService;
        }

        // GET: api/photo/event/1 (All photos - admin only)
        [HttpGet("event/{eventId}")]
        [Authorize] // Requires authentication
        public async Task<ActionResult<IEnumerable<PhotoDto>>> GetByEventId(int eventId)
        {
            // ✅ Check authorization
            var userEmail = User.Identity?.Name;
            if (!await _eventAuthorizationService.CanAccessEventAsync(userEmail!, eventId))
                return Forbid(); // 403 Forbidden

            var photos = await _photoService.GetByEventIdAsync(eventId);
            return Ok(photos);
        }

        // GET: api/photo/event/1/visible (Public - for invitation page)
        [HttpGet("event/{eventId}/visible")]
        public async Task<ActionResult<IEnumerable<PhotoDto>>> GetVisibleByEventId(int eventId)
        {
            var photos = await _photoService.GetVisibleByEventIdAsync(eventId);
            return Ok(photos);
        }

        // GET: api/photo/event/1/approved (Public)
        [HttpGet("event/{eventId}/approved")]
        public async Task<ActionResult<IEnumerable<PhotoDto>>> GetApprovedByEventId(int eventId)
        {
            var photos = await _photoService.GetApprovedByEventIdAsync(eventId);
            return Ok(photos);
        }

        // GET: api/photo/event/1/couple-media (Public - for template rendering)
        [HttpGet("event/{eventId}/couple-media")]
        public async Task<ActionResult<IEnumerable<PhotoDto>>> GetCoupleMedia(int eventId)
        {
            var photos = await _photoService.GetCoupleMediaByEventIdAsync(eventId);
            return Ok(photos);
        }

        // GET: api/photo/event/1/pending (Admin only)
        [HttpGet("event/{eventId}/pending")]
        [Authorize]
        public async Task<ActionResult<IEnumerable<PhotoDto>>> GetPendingByEventId(int eventId)
        {
            // ✅ Check authorization
            var userEmail = User.Identity?.Name;
            if (!await _eventAuthorizationService.CanAccessEventAsync(userEmail!, eventId))
                return Forbid();

            var photos = await _photoService.GetPendingByEventIdAsync(eventId);
            return Ok(photos);
        }

        // POST: api/photo/event/1 (Upload photo — guest or couple)
        [HttpPost("event/{eventId}")]
        [EnableRateLimiting("public-upload")]
        public async Task<ActionResult<PhotoDto>> Upload(
            int eventId,
            [FromForm] PhotoUploadDto uploadDto)
        {
            // Couple uploads require authentication + event ownership
            if (uploadDto.UploadedBy == "COUPLE")
            {
                if (!User.Identity?.IsAuthenticated ?? true)
                    return Unauthorized(new { message = "Authentication required for couple uploads" });

                var userEmail = User.Identity?.Name;
                if (!await _eventAuthorizationService.CanAccessEventAsync(userEmail!, eventId))
                    return Forbid();
            }

            try
            {
                var photo = await _photoService.UploadAsync(eventId, uploadDto);
                return Ok(photo);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
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

        // PUT: api/photo/5/approve (Admin only)
        [HttpPut("{id}/approve")]
        [Authorize]
        public async Task<ActionResult<PhotoDto>> Approve(
            int id,
            [FromBody] ApprovePhotoDto approveDto)
        {
            try
            {
                // Get the photo to check event ownership
                var photo = await _photoService.GetByIdAsync(id);
                if (photo == null)
                    return NotFound(new { message = "Photo not found" });

                // ✅ Check authorization
                var userEmail = User.Identity?.Name;
                if (!await _eventAuthorizationService.CanAccessEventAsync(userEmail!, photo.EventId))
                    return Forbid();

                // TODO: Get actual user ID from JWT claims
                var userId = 1;

                var updatedPhoto = await _photoService.ApproveAsync(id, approveDto, userId);
                return Ok(updatedPhoto);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        // PUT: api/photo/5/featured (Admin only)
        [HttpPut("{id}/featured")]
        [Authorize]
        public async Task<ActionResult<PhotoDto>> SetFeatured(
            int id,
            [FromBody] SetFeaturedDto featuredDto)
        {
            try
            {
                // Get the photo to check event ownership
                var photo = await _photoService.GetByIdAsync(id);
                if (photo == null)
                    return NotFound(new { message = "Photo not found" });

                // ✅ Check authorization
                var userEmail = User.Identity?.Name;
                if (!await _eventAuthorizationService.CanAccessEventAsync(userEmail!, photo.EventId))
                    return Forbid();

                var updatedPhoto = await _photoService.SetFeaturedAsync(id, featuredDto.IsFeatured);
                return Ok(updatedPhoto);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        // DELETE: api/photo/5 (Admin only)
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> Delete(int id)
        {
            // Get the photo to check event ownership
            var photo = await _photoService.GetByIdAsync(id);
            if (photo == null)
                return NotFound(new { message = "Photo not found" });

            // ✅ Check authorization
            var userEmail = User.Identity?.Name;
            if (!await _eventAuthorizationService.CanAccessEventAsync(userEmail!, photo.EventId))
                return Forbid();

            var success = await _photoService.DeleteAsync(id);
            if (!success)
                return NotFound(new { message = $"Photo with ID {id} not found" });

            return Ok(new { message = "Photo deleted successfully" });
        }
    }
}
