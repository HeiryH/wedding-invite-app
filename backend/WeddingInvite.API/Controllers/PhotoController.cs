using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WeddingInvite.Core.DTOs;
using WeddingInvite.Core.Services;

namespace WeddingInvite.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PhotoController : ControllerBase
    {
        private readonly IPhotoService _photoService;
        private readonly IWeddingAuthorizationService _weddingAuthorizationService; // ✅ USE SERVICE, NOT REPO
        
        public PhotoController(
            IPhotoService photoService,
            IWeddingAuthorizationService weddingAuthorizationService) // ✅ INJECT SERVICE
        {
            _photoService = photoService;
            _weddingAuthorizationService = weddingAuthorizationService;
        }
        
        // GET: api/photo/wedding/1 (All photos - admin only)
        [HttpGet("wedding/{weddingId}")]
        [Authorize] // Requires authentication
        public async Task<ActionResult<IEnumerable<PhotoDto>>> GetByWeddingId(int weddingId)
        {
            // ✅ Check authorization
            var userEmail = User.Identity?.Name;
            if (!await _weddingAuthorizationService.CanAccessWeddingAsync(userEmail!, weddingId))
                return Forbid(); // 403 Forbidden

            var photos = await _photoService.GetByWeddingIdAsync(weddingId);
            return Ok(photos);
        }
        
        // GET: api/photo/wedding/1/visible (Public - for invitation page)
        [HttpGet("wedding/{weddingId}/visible")]
        public async Task<ActionResult<IEnumerable<PhotoDto>>> GetVisibleByWeddingId(int weddingId)
        {
            var photos = await _photoService.GetVisibleByWeddingIdAsync(weddingId);
            return Ok(photos);
        }
        
        // GET: api/photo/wedding/1/approved (Public)
        [HttpGet("wedding/{weddingId}/approved")]
        public async Task<ActionResult<IEnumerable<PhotoDto>>> GetApprovedByWeddingId(int weddingId)
        {
            var photos = await _photoService.GetApprovedByWeddingIdAsync(weddingId);
            return Ok(photos);
        }

        // GET: api/photo/wedding/1/couple-media (Public - for template rendering)
        [HttpGet("wedding/{weddingId}/couple-media")]
        public async Task<ActionResult<IEnumerable<PhotoDto>>> GetCoupleMedia(int weddingId)
        {
            var photos = await _photoService.GetCoupleMediaByWeddingIdAsync(weddingId);
            return Ok(photos);
        }
        
        // GET: api/photo/wedding/1/pending (Admin only)
        [HttpGet("wedding/{weddingId}/pending")]
        [Authorize]
        public async Task<ActionResult<IEnumerable<PhotoDto>>> GetPendingByWeddingId(int weddingId)
        {
            // ✅ Check authorization
            var userEmail = User.Identity?.Name;
            if (!await _weddingAuthorizationService.CanAccessWeddingAsync(userEmail!, weddingId))
                return Forbid();

            var photos = await _photoService.GetPendingByWeddingIdAsync(weddingId);
            return Ok(photos);
        }
        
        // POST: api/photo/wedding/1 (Upload photo — guest or couple)
        [HttpPost("wedding/{weddingId}")]
        public async Task<ActionResult<PhotoDto>> Upload(
            int weddingId,
            [FromForm] PhotoUploadDto uploadDto)
        {
            // Couple uploads require authentication + wedding ownership
            if (uploadDto.UploadedBy == "COUPLE")
            {
                if (!User.Identity?.IsAuthenticated ?? true)
                    return Unauthorized(new { message = "Authentication required for couple uploads" });

                var userEmail = User.Identity?.Name;
                if (!await _weddingAuthorizationService.CanAccessWeddingAsync(userEmail!, weddingId))
                    return Forbid();
            }

            try
            {
                var photo = await _photoService.UploadAsync(weddingId, uploadDto);
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
                // Get the photo to check wedding ownership
                var photo = await _photoService.GetByIdAsync(id);
                if (photo == null)
                    return NotFound(new { message = "Photo not found" });

                // ✅ Check authorization
                var userEmail = User.Identity?.Name;
                if (!await _weddingAuthorizationService.CanAccessWeddingAsync(userEmail!, photo.WeddingId))
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
                // Get the photo to check wedding ownership
                var photo = await _photoService.GetByIdAsync(id);
                if (photo == null)
                    return NotFound(new { message = "Photo not found" });

                // ✅ Check authorization
                var userEmail = User.Identity?.Name;
                if (!await _weddingAuthorizationService.CanAccessWeddingAsync(userEmail!, photo.WeddingId))
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
            // Get the photo to check wedding ownership
            var photo = await _photoService.GetByIdAsync(id);
            if (photo == null)
                return NotFound(new { message = "Photo not found" });

            // ✅ Check authorization
            var userEmail = User.Identity?.Name;
            if (!await _weddingAuthorizationService.CanAccessWeddingAsync(userEmail!, photo.WeddingId))
                return Forbid();

            var success = await _photoService.DeleteAsync(id);
            if (!success)
                return NotFound(new { message = $"Photo with ID {id} not found" });
            
            return Ok(new { message = "Photo deleted successfully" });
        }
    }
}