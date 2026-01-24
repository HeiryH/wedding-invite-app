using Microsoft.AspNetCore.Mvc;
using WeddingInvite.Core.DTOs;
using WeddingInvite.Core.Services;

namespace WeddingInvite.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class WeddingFeatureController : ControllerBase
    {
        private readonly IWeddingFeatureService _weddingFeatureService;
        
        public WeddingFeatureController(IWeddingFeatureService weddingFeatureService)
        {
            _weddingFeatureService = weddingFeatureService;
        }
        
        // GET: api/weddingfeature/wedding/5
        [HttpGet("wedding/{weddingId}")]
        public async Task<ActionResult<IEnumerable<WeddingFeatureDto>>> GetWeddingFeatures(int weddingId)
        {
            var features = await _weddingFeatureService.GetWeddingFeaturesAsync(weddingId);
            return Ok(features);
        }
        
        // GET: api/weddingfeature/wedding/5/with-features
        [HttpGet("wedding/{weddingId}/with-features")]
        public async Task<ActionResult<WeddingWithFeaturesDto>> GetWeddingWithFeatures(int weddingId)
        {
            try
            {
                var result = await _weddingFeatureService.GetWeddingWithFeaturesAsync(weddingId);
                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }
        
        // POST: api/weddingfeature/wedding/5/toggle
        [HttpPost("wedding/{weddingId}/toggle")]
        public async Task<ActionResult<WeddingFeatureDto>> ToggleFeature(
            int weddingId, 
            [FromBody] ToggleFeatureDto toggleDto)
        {
            try
            {
                var result = await _weddingFeatureService.ToggleFeatureAsync(weddingId, toggleDto);
                return Ok(result);
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
        
        // POST: api/weddingfeature/wedding/5/bulk-toggle
        [HttpPost("wedding/{weddingId}/bulk-toggle")]
        public async Task<ActionResult> BulkToggleFeatures(
            int weddingId, 
            [FromBody] List<ToggleFeatureDto> features)
        {
            try
            {
                await _weddingFeatureService.BulkToggleFeaturesAsync(weddingId, features);
                return Ok(new { message = "Features updated successfully" });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }
        
        // GET: api/weddingfeature/wedding/5/check/PHOTO_BOOTH
        [HttpGet("wedding/{weddingId}/check/{featureCode}")]
        public async Task<ActionResult<bool>> IsFeatureEnabled(int weddingId, string featureCode)
        {
            var isEnabled = await _weddingFeatureService.IsFeatureEnabledAsync(weddingId, featureCode);
            return Ok(new { featureCode, isEnabled });
        }
    }
}