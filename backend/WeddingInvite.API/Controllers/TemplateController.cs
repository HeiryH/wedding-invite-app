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
    }
}