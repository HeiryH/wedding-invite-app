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
        private readonly ITemplateDesignService _templateDesignService;

        public TemplateController(
            ITemplateService templateService,
            ITemplateConfigService templateConfigService,
            ITemplateDesignService templateDesignService)
        {
            _templateService = templateService;
            _templateConfigService = templateConfigService;
            _templateDesignService = templateDesignService;
        }

        // ── Design bundles: move a tuned template between environments (local → prod) ────────

        // GET: api/template/design-export?ids=7,11 — zip of starting designs, authored stages,
        // thumbnails and every /uploads asset they reference. No ids ⇒ every template.
        [HttpGet("design-export")]
        [Authorize(Roles = "SUPER_ADMIN")]
        public async Task<IActionResult> ExportDesign([FromQuery] string? ids)
        {
            var list = (ids ?? string.Empty)
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Select(s => int.TryParse(s, out var n) ? n : (int?)null)
                .Where(n => n.HasValue).Select(n => n!.Value).ToList();
            var bytes = await _templateDesignService.ExportAsync(list);
            var name = list.Count == 1 ? $"template-design-{list[0]}" : "template-designs";
            return File(bytes, "application/zip", $"{name}-{DateTime.UtcNow:yyyyMMdd-HHmmss}.zip");
        }

        // POST: api/template/design-import (multipart: file, applyMeta) — apply a bundle. Matches
        // templates by code; unknown codes are reported in `skipped`, not created.
        [HttpPost("design-import")]
        [Authorize(Roles = "SUPER_ADMIN")]
        [RequestSizeLimit(200L * 1024 * 1024)]
        public async Task<ActionResult<TemplateDesignImportResult>> ImportDesign(IFormFile file, [FromForm] bool applyMeta = false)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "A bundle zip is required" });
            try
            {
                await using var stream = file.OpenReadStream();
                var result = await _templateDesignService.ImportAsync(stream, applyMeta);
                return Ok(result);
            }
            // ZipArchive reports garbage input as ArgumentOutOfRange/InvalidData — fold both
            // into one friendly message; our own validation errors are plain ArgumentException.
            catch (ArgumentOutOfRangeException)
            {
                return BadRequest(new { message = "File is not a valid zip bundle" });
            }
            catch (InvalidDataException)
            {
                return BadRequest(new { message = "File is not a valid zip bundle" });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (System.Text.Json.JsonException)
            {
                return BadRequest(new { message = "design.json in the bundle is malformed" });
            }
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

        // POST: api/template — create a brand-new authored template (blank canvas). Templates 1-7
        // are seeded, never created here.
        [HttpPost]
        [Authorize(Roles = "SUPER_ADMIN")]
        public async Task<ActionResult<TemplateDto>> Create([FromBody] CreateTemplateDto createDto)
        {
            try
            {
                var template = await _templateService.CreateAsync(createDto);
                return CreatedAtAction(nameof(GetById), new { id = template.TemplateId }, template);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
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

        // POST: api/template/5/assets — upload an image for a stage background or layer while
        // authoring. Not tied to a wedding: PhotoService requires a real Wedding row, and a
        // template being authored may have none yet, so this is a separate upload path under the
        // same wwwroot/uploads/templates folder as the thumbnail.
        [HttpPost("{id}/assets")]
        [Authorize(Roles = "SUPER_ADMIN")]
        [EnableRateLimiting("public-upload")]
        public async Task<ActionResult<object>> UploadAsset(int id, [FromForm] IFormFile file)
        {
            try
            {
                var url = await _templateService.UploadAssetAsync(id, file);
                return Ok(new { url });
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

        // PUT: api/template/5/default-config/from-event/12 — capture event 12's finished design
        // as template 5's starting design (couple-content keys excluded).
        [HttpPut("{id}/default-config/from-event/{eventId}")]
        [Authorize(Roles = "SUPER_ADMIN")]
        public async Task<ActionResult<object>> SetDefaultFromWedding(int id, int eventId)
        {
            await _templateConfigService.SetDefaultFromWeddingAsync(id, eventId);
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

        // ── Authored templates (data, not code — see frontend _shared/DataTemplate.tsx) ──────────

        // PUT: api/template/5/stages — set the whole stage/layer composition; flips IsAuthored=true.
        [HttpPut("{id}/stages")]
        [Authorize(Roles = "SUPER_ADMIN")]
        public async Task<ActionResult<TemplateDto>> SetStages(int id, [FromBody] SetTemplateStagesDto dto)
        {
            try
            {
                var template = await _templateService.SetStagesAsync(id, dto.StagesJson);
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

        // DELETE: api/template/5/stages — clear it; falls back to the hand-coded component (if any).
        [HttpDelete("{id}/stages")]
        [Authorize(Roles = "SUPER_ADMIN")]
        public async Task<ActionResult<TemplateDto>> ClearStages(int id)
        {
            try
            {
                var template = await _templateService.ClearStagesAsync(id);
                return Ok(template);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }
    }
}