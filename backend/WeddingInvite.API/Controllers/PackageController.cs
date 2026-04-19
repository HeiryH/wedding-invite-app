using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WeddingInvite.Core.DTOs;
using WeddingInvite.Core.Services;

namespace WeddingInvite.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PackageController : ControllerBase
    {
        private readonly IPackageService _packageService;

        public PackageController(IPackageService packageService)
        {
            _packageService = packageService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<PackageDto>>> GetAll()
        {
            var packages = await _packageService.GetAllAsync();
            return Ok(packages);
        }

        [HttpGet("active")]
        public async Task<ActionResult<IEnumerable<PackageDto>>> GetActive()
        {
            var packages = await _packageService.GetActiveAsync();
            return Ok(packages);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<PackageDto>> GetById(int id)
        {
            var package = await _packageService.GetByIdAsync(id);

            if (package == null)
                return NotFound(new { message = $"Package with ID {id} not found" });

            return Ok(package);
        }

        [HttpGet("code/{code}")]
        public async Task<ActionResult<PackageDto>> GetByCode(string code)
        {
            var package = await _packageService.GetByCodeAsync(code);

            if (package == null)
                return NotFound(new { message = $"Package '{code}' not found" });

            return Ok(package);
        }

        [HttpPost]
        [Authorize(Roles = "SUPER_ADMIN")]
        public async Task<ActionResult<PackageDto>> Create([FromBody] CreatePackageDto createDto)
        {
            try
            {
                var package = await _packageService.CreateAsync(createDto);
                return CreatedAtAction(nameof(GetById), new { id = package.PackageId }, package);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "SUPER_ADMIN")]
        public async Task<ActionResult<PackageDto>> Update(int id, [FromBody] UpdatePackageDto updateDto)
        {
            try
            {
                var package = await _packageService.UpdateAsync(id, updateDto);
                return Ok(package);
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

        [HttpDelete("{id}")]
        [Authorize(Roles = "SUPER_ADMIN")]
        public async Task<ActionResult> Delete(int id)
        {
            var deleted = await _packageService.DeleteAsync(id);

            if (!deleted)
                return NotFound(new { message = $"Package with ID {id} not found" });

            return NoContent();
        }
    }
}
