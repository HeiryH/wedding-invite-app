using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WeddingInvite.Core.DTOs;
using WeddingInvite.Core.Services;

namespace WeddingInvite.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EventFeatureController : ControllerBase
    {
        private readonly IEventFeatureService _eventFeatureService;
        private readonly IEventAuthorizationService _eventAuthorizationService;

        public EventFeatureController(
            IEventFeatureService eventFeatureService,
            IEventAuthorizationService eventAuthorizationService)
        {
            _eventFeatureService = eventFeatureService;
            _eventAuthorizationService = eventAuthorizationService;
        }

        // GET: api/eventfeature/event/5
        [HttpGet("event/{eventId}")]
        public async Task<ActionResult<IEnumerable<EventFeatureDto>>> GetEventFeatures(int eventId)
        {
            var features = await _eventFeatureService.GetEventFeaturesAsync(eventId);
            return Ok(features);
        }

        // GET: api/eventfeature/event/5/with-features
        [HttpGet("event/{eventId}/with-features")]
        public async Task<ActionResult<EventWithFeaturesDto>> GetEventWithFeatures(int eventId)
        {
            try
            {
                var result = await _eventFeatureService.GetEventWithFeaturesAsync(eventId);
                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        // POST: api/eventfeature/event/5/toggle
        [HttpPost("event/{eventId}/toggle")]
        [Authorize]
        public async Task<ActionResult<EventFeatureDto>> ToggleFeature(
            int eventId,
            [FromBody] ToggleFeatureDto toggleDto)
        {
            var userEmail = User.Identity?.Name;
            if (!await _eventAuthorizationService.CanAccessEventAsync(userEmail!, eventId))
                return Forbid();

            try
            {
                var result = await _eventFeatureService.ToggleFeatureAsync(eventId, toggleDto);
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

        // POST: api/eventfeature/event/5/bulk-toggle
        [HttpPost("event/{eventId}/bulk-toggle")]
        [Authorize]
        public async Task<ActionResult> BulkToggleFeatures(
            int eventId,
            [FromBody] List<ToggleFeatureDto> features)
        {
            var userEmail = User.Identity?.Name;
            if (!await _eventAuthorizationService.CanAccessEventAsync(userEmail!, eventId))
                return Forbid();

            try
            {
                await _eventFeatureService.BulkToggleFeaturesAsync(eventId, features);
                return Ok(new { message = "Features updated successfully" });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        // GET: api/eventfeature/event/5/check/PHOTO_BOOTH
        [HttpGet("event/{eventId}/check/{featureCode}")]
        public async Task<ActionResult<bool>> IsFeatureEnabled(int eventId, string featureCode)
        {
            var isEnabled = await _eventFeatureService.IsFeatureEnabledAsync(eventId, featureCode);
            return Ok(new { featureCode, isEnabled });
        }
    }
}
