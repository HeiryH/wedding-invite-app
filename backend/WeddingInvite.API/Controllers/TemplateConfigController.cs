using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WeddingInvite.Core.Config;
using WeddingInvite.Core.Services;

namespace WeddingInvite.API.Controllers
{
    [ApiController]
    [Route("api/template-config")]
    public class TemplateConfigController : ControllerBase
    {
        private readonly ITemplateConfigService _configService;
        private readonly IEventAuthorizationService _authService;

        public TemplateConfigController(
            ITemplateConfigService configService,
            IEventAuthorizationService authService)
        {
            _configService = configService;
            _authService = authService;
        }

        // GET: api/template-config/event/5  (public — invitation page reads it)
        [HttpGet("event/{eventId}")]
        public async Task<ActionResult<Dictionary<string, string>>> GetByEventId(int eventId)
        {
            var config = await _configService.GetConfigAsync(eventId);
            return Ok(config);
        }

        // GET: api/template-config/template/7/default  (public — the sample/thumbnail preview
        // renders no real event, so it reads the template's captured "starting design" directly.
        // Already couple-content-free by construction (SetDefaultFromWeddingAsync strips it), so
        // this is safe to expose with no auth — same posture as the event-config GET above.)
        [HttpGet("template/{templateId}/default")]
        public async Task<ActionResult<Dictionary<string, string>>> GetTemplateDefault(int templateId)
        {
            var config = await _configService.GetDefaultAsync(templateId);
            return Ok(config);
        }

        // PUT: api/template-config/event/5  (authorized — couple admin or super admin)
        [HttpPut("event/{eventId}")]
        [Authorize]
        public async Task<ActionResult> Save(int eventId, [FromBody] Dictionary<string, string> config)
        {
            var email = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value
                        ?? User.FindFirst("email")?.Value
                        ?? string.Empty;

            if (!await _authService.CanAccessEventAsync(email, eventId))
                return Forbid();

            var error = TemplateConfigPolicy.Validate(config);
            if (error != null)
                return BadRequest(new { message = error });

            var role = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value
                       ?? User.FindFirst("role")?.Value
                       ?? string.Empty;

            // Tier gates the stage-layout (t*.layout.*) keys — the Adjust panel is PRO-only.
            var tier = User.FindFirst("Tier")?.Value;

            await _configService.SaveConfigAsync(eventId, config, role, tier);
            return NoContent();
        }
    }
}
