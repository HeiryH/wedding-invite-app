using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using WeddingInvite.Core.DTOs;
using WeddingInvite.Core.Services;

namespace WeddingInvite.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TemplateController : ControllerBase
    {
        private readonly ITemplateService _templateService;
        private readonly ITemplateConfigService _templateConfigService;

        public TemplateController(
            ITemplateService templateService,
            ITemplateConfigService templateConfigService)
        {
            _templateService = templateService;
            _templateConfigService = templateConfigService;
        }
        
        [HttpGet]
        public async Task<ActionResult<IEnumerable<TemplateDto>>> GetAll()
        {
            var templates = await _templateService.GetAllAsync();
            return Ok(templates);
        }
        
        [HttpGet("active")]
        public async Task<ActionResult<IEnumerable<TemplateDto>>> GetActive()
        {
            var templates = await _templateService.GetActiveAsync();
            return Ok(templates);
        }
        
        // GET: api/template/usage
        [HttpGet("usage")]
        [Authorize(Roles = "SUPER_ADMIN")]
        public async Task<ActionResult<IEnumerable<TemplateUsageDto>>> GetUsage()
        {
            var templates = await _templateService.GetAllWithUsageAsync();
            return Ok(templates);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<TemplateDto>> GetById(int id)
        {
            var template = await _templateService.GetByIdAsync(id);
            
            if (template == null)
                return NotFound(new { message = $"Template with ID {id} not found" });
            
            return Ok(template);
        }
        
        [HttpGet("code/{code}")]
        public async Task<ActionResult<TemplateDto>> GetByCode(string code)
        {
            var template = await _templateService.GetByCodeAsync(code);
            
            if (template == null)
                return NotFound(new { message = $"Template '{code}' not found" });

            return Ok(template);
        }

        // PUT: api/template/5
        [HttpPut("{id}")]
        [Authorize(Roles = "SUPER_ADMIN")]
        public async Task<ActionResult<TemplateDto>> Update(int id, [FromBody] UpdateTemplateMetaDto updateDto)
        {
            try
            {
                var template = await _templateService.UpdateAsync(id, updateDto);
                return Ok(template);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        // POST: api/template/5/thumbnail — set the picker thumbnail (e.g. from the super-admin
        // screenshot tool). Persisted under wwwroot/uploads, not frontend/public — see
        // TemplateService.SetThumbnailAsync for why.
        [HttpPost("{id}/thumbnail")]
        [Authorize(Roles = "SUPER_ADMIN")]
        [EnableRateLimiting("public-upload")]
        public async Task<ActionResult<TemplateDto>> SetThumbnail(int id, [FromForm] IFormFile file)
        {
            try
            {
                var template = await _templateService.SetThumbnailAsync(id, file);
                return Ok(template);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // ── Per-template starting-design defaults (super admin) ─────────────────────────────────

        // GET: api/template/5/default-config — status for the themes admin UI.
        [HttpGet("{id}/default-config")]
        [Authorize(Roles = "SUPER_ADMIN")]
        public async Task<ActionResult<object>> GetDefaultConfig(int id)
        {
            var keyCount = await _templateConfigService.GetDefaultKeyCountAsync(id);
            return Ok(new { templateId = id, keyCount });
        }

        // PUT: api/template/5/default-config/from-wedding/12 — capture wedding 12's finished design
        // as template 5's starting design (couple-content keys excluded).
        [HttpPut("{id}/default-config/from-wedding/{weddingId}")]
        [Authorize(Roles = "SUPER_ADMIN")]
        public async Task<ActionResult<object>> SetDefaultFromWedding(int id, int weddingId)
        {
            await _templateConfigService.SetDefaultFromWeddingAsync(id, weddingId);
            var keyCount = await _templateConfigService.GetDefaultKeyCountAsync(id);
            return Ok(new { templateId = id, keyCount });
        }

        // DELETE: api/template/5/default-config — clear the starting design (fall back to code defaults).
        [HttpDelete("{id}/default-config")]
        [Authorize(Roles = "SUPER_ADMIN")]
        public async Task<ActionResult<object>> ClearDefaultConfig(int id)
        {
            await _templateConfigService.ClearDefaultAsync(id);
            return Ok(new { templateId = id, keyCount = 0 });
        }
    }
}