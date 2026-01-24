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
        
        public PhotoController(IPhotoService photoService)
        {
            _photoService = photoService;
        }
        
        // GET: api/photo/5
        [HttpGet("{id}")]
        public async Task<ActionResult<PhotoDto>> GetById(int id)
        {
            var photo = await _photoService.GetByIdAsync(id);
            
            if (photo == null)
                return NotFound(new { message = $"Photo with ID {id} not found" });
            
            return Ok(photo);
        }
        
        // GET: api/photo/wedding/5
        [HttpGet("wedding/{weddingId}")]
        public async Task<ActionResult<IEnumerable<PhotoDto>>> GetByWeddingId(int weddingId)
        {
            var photos = await _photoService.GetByWeddingIdAsync(weddingId);
            return Ok(photos);
        }
        
        // GET: api/photo/wedding/5/visible
        [HttpGet("wedding/{weddingId}/visible")]
        public async Task<ActionResult<IEnumerable<PhotoDto>>> GetVisibleByWeddingId(int weddingId)
        {
            var photos = await _photoService.GetVisibleByWeddingIdAsync(weddingId);
            return Ok(photos);
        }
        
        // GET: api/photo/wedding/5/count
        [HttpGet("wedding/{weddingId}/count")]
        public async Task<ActionResult<int>> GetPhotoCount(int weddingId)
        {
            var count = await _photoService.GetPhotoCountAsync(weddingId);
            return Ok(new { weddingId, photoCount = count });
        }
        
        // COMMENTED OUT FOR NOW - Will be called from Next.js directly
        // POST: api/photo/wedding/5
        // [HttpPost("wedding/{weddingId}")]
        // public async Task<ActionResult<PhotoDto>> Upload(
        //     int weddingId,
        //     [FromForm] CreatePhotoDto createDto,
        //     [FromForm] IFormFile file)
        // {
        //     try
        //     {
        //         var photo = await _photoService.UploadPhotoAsync(weddingId, createDto, file);
        //         return CreatedAtAction(nameof(GetById), new { id = photo.PhotoId }, photo);
        //     }
        //     catch (KeyNotFoundException ex)
        //     {
        //         return NotFound(new { message = ex.Message });
        //     }
        //     catch (InvalidOperationException ex)
        //     {
        //         return BadRequest(new { message = ex.Message });
        //     }
        //     catch (ArgumentException ex)
        //     {
        //         return BadRequest(new { message = ex.Message });
        //     }
        // }

        // POST: api/photo/wedding/5/upload-simple
        [HttpPost("wedding/{weddingId}/upload-simple")]
        [Consumes("multipart/form-data")]
        public async Task<ActionResult<PhotoDto>> UploadSimple(
            int weddingId,
            IFormFile file,
            // string? guestName = null,
            // string? caption = null
            [FromForm] string guestName,
            [FromForm] string caption
            )
        {
            try
            {
                var createDto = new CreatePhotoDto
                {
                    GuestName = guestName ?? "Anonymous",
                    Caption = caption ?? ""
                };
                
                var photo = await _photoService.UploadPhotoAsync(weddingId, createDto, file);
                return CreatedAtAction(nameof(GetById), new { id = photo.PhotoId }, photo);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        } 

        
        // PUT: api/photo/5
        [HttpPut("{id}")]
        public async Task<ActionResult<PhotoDto>> Update(int id, [FromBody] UpdatePhotoDto updateDto)
        {
            try
            {
                var photo = await _photoService.UpdateAsync(id, updateDto);
                return Ok(photo);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }
        
        // DELETE: api/photo/5
        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(int id)
        {
            var result = await _photoService.DeleteAsync(id);
            
            if (!result)
                return NotFound(new { message = $"Photo with ID {id} not found" });
            
            return NoContent();
        }
    }
}