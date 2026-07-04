using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WeddingInvite.Core.DTOs;
using WeddingInvite.Core.Services;

namespace WeddingInvite.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TemplateController : ControllerBase
    {
        private readonly ITemplateService _templateService;
        
        public TemplateController(ITemplateService templateService)
        {
            _templateService = templateService;
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
    }
}