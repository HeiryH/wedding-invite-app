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
        private readonly IWeddingAuthorizationService _authService;

        public TemplateConfigController(
            ITemplateConfigService configService,
            IWeddingAuthorizationService authService)
        {
            _configService = configService;
            _authService = authService;
        }

        // GET: api/template-config/wedding/5  (public — invitation page reads it)
        [HttpGet("wedding/{weddingId}")]
        public async Task<ActionResult<Dictionary<string, string>>> GetByWeddingId(int weddingId)
        {
            var config = await _configService.GetConfigAsync(weddingId);
            return Ok(config);
        }

        // GET: api/template-config/template/7/default  (public — the sample/thumbnail preview
        // renders no real wedding, so it reads the template's captured "starting design" directly.
        // Already couple-content-free by construction (SetDefaultFromWeddingAsync strips it), so
        // this is safe to expose with no auth — same posture as the wedding-config GET above.)
        [HttpGet("template/{templateId}/default")]
        public async Task<ActionResult<Dictionary<string, string>>> GetTemplateDefault(int templateId)
        {
            var config = await _configService.GetDefaultAsync(templateId);
            return Ok(config);
        }

        // PUT: api/template-config/wedding/5  (authorized — couple admin or super admin)
        [HttpPut("wedding/{weddingId}")]
        [Authorize]
        public async Task<ActionResult> Save(int weddingId, [FromBody] Dictionary<string, string> config)
        {
            var email = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value
                        ?? User.FindFirst("email")?.Value
                        ?? string.Empty;

            if (!await _authService.CanAccessWeddingAsync(email, weddingId))
                return Forbid();

            var error = TemplateConfigPolicy.Validate(config);
            if (error != null)
                return BadRequest(new { message = error });

            var role = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value
                       ?? User.FindFirst("role")?.Value
                       ?? string.Empty;

            // Tier gates the stage-layout (t*.layout.*) keys — the Adjust panel is PRO-only.
            var tier = User.FindFirst("Tier")?.Value;

            await _configService.SaveConfigAsync(weddingId, config, role, tier);
            return NoContent();
        }
    }
}
