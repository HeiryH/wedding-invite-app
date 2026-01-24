using Microsoft.AspNetCore.Mvc;
using WeddingInvite.Core.DTOs;
using WeddingInvite.Core.Services;

namespace WeddingInvite.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FeatureController : ControllerBase
    {
        private readonly IFeatureService _featureService;
        
        public FeatureController(IFeatureService featureService)
        {
            _featureService = featureService;
        }
        
        // GET: api/feature
        [HttpGet]
        public async Task<ActionResult<IEnumerable<FeatureDto>>> GetAll()
        {
            var features = await _featureService.GetAllAsync();
            return Ok(features);
        }
        
        // GET: api/feature/active
        [HttpGet("active")]
        public async Task<ActionResult<IEnumerable<FeatureDto>>> GetActive()
        {
            var features = await _featureService.GetActiveAsync();
            return Ok(features);
        }
        
        // GET: api/feature/5
        [HttpGet("{id}")]
        public async Task<ActionResult<FeatureDto>> GetById(int id)
        {
            var feature = await _featureService.GetByIdAsync(id);
            
            if (feature == null)
                return NotFound(new { message = $"Feature with ID {id} not found" });
            
            return Ok(feature);
        }
        
        // GET: api/feature/code/PHOTO_BOOTH
        [HttpGet("code/{code}")]
        public async Task<ActionResult<FeatureDto>> GetByCode(string code)
        {
            var feature = await _featureService.GetByCodeAsync(code);
            
            if (feature == null)
                return NotFound(new { message = $"Feature '{code}' not found" });
            
            return Ok(feature);
        }
        
        // POST: api/feature
        [HttpPost]
        public async Task<ActionResult<FeatureDto>> Create([FromBody] CreateFeatureDto createDto)
        {
            try
            {
                var feature = await _featureService.CreateAsync(createDto);
                return CreatedAtAction(nameof(GetById), new { id = feature.FeatureId }, feature);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
        
        // PUT: api/feature/5
        [HttpPut("{id}")]
        public async Task<ActionResult<FeatureDto>> Update(int id, [FromBody] UpdateFeatureDto updateDto)
        {
            try
            {
                var feature = await _featureService.UpdateAsync(id, updateDto);
                return Ok(feature);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }
        
        // DELETE: api/feature/5
        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(int id)
        {
            var result = await _featureService.DeleteAsync(id);
            
            if (!result)
                return NotFound(new { message = $"Feature with ID {id} not found" });
            
            return NoContent();
        }
    }
}