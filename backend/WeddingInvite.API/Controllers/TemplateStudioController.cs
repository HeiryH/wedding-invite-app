using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.RateLimiting;
using WeddingInvite.Core.Services;

namespace WeddingInvite.API.Controllers;

[ApiController]
[Route("api/template/{templateId:int}/studio")]
[Authorize(Roles = "SUPER_ADMIN")]
public class TemplateStudioController(TemplateStudioService studio, TemplateStudioExportService exports, ITemplateService templates) : ControllerBase
{
    [HttpGet]
    public Task<IActionResult> Get(int templateId) => Run(() => studio.GetAsync(templateId));
    [HttpPut("draft")]
    [RequestSizeLimit(8_000_000)]
    public Task<IActionResult> Save(int templateId, StudioSaveDto request) => Run(() => studio.SaveAsync(templateId, request));
    [HttpPost("publish")]
    public Task<IActionResult> Publish(int templateId, StudioVersionDto request) => Run(() => studio.PublishAsync(templateId, request.Version));
    [HttpPost("restore")]
    public Task<IActionResult> Restore(int templateId, StudioRestoreDto request) => Run(() => studio.RestoreAsync(templateId, request));

    [HttpPost("export")]
    public async Task<IActionResult> Export(int templateId, StudioVersionDto request)
    {
        try { return File(await exports.ExportAsync(templateId, request.Version), "application/zip", $"template-{templateId}-published.zip"); }
        catch (KeyNotFoundException e) { return NotFound(new { message = e.Message }); }
        catch (ArgumentException e) { return BadRequest(new { message = e.Message }); }
        catch (InvalidOperationException e) { return Conflict(new { message = e.Message }); }
    }

    [HttpPost("thumbnail")]
    [EnableRateLimiting("public-upload")]
    public async Task<IActionResult> Thumbnail(int templateId, [FromForm] IFormFile file,
        [FromForm] int version, [FromForm] string publishedDesignHash)
    {
        try { return Ok(await studio.SetThumbnailAsync(templateId, version, publishedDesignHash, file, templates)); }
        catch (KeyNotFoundException e) { return NotFound(new { message = e.Message }); }
        catch (ArgumentException e) { return BadRequest(new { message = e.Message }); }
        catch (InvalidOperationException e) { return Conflict(new { message = e.Message }); }
    }

    private async Task<IActionResult> Run(Func<Task<StudioStateDto>> action)
    {
        try { return Ok(await action()); }
        catch (KeyNotFoundException e) { return NotFound(new { message = e.Message }); }
        catch (ArgumentException e) { return BadRequest(new { message = e.Message }); }
        catch (DbUpdateConcurrencyException) { return Conflict(new { message = "This design changed in another session. Reload before continuing." }); }
        catch (DbUpdateException) { return Conflict(new { message = "The design could not be saved. Reload and try again." }); }
        catch (InvalidOperationException e) { return Conflict(new { message = e.Message }); }
    }
}
