using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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

            await _configService.SaveConfigAsync(weddingId, config);
            return NoContent();
        }
    }
}
