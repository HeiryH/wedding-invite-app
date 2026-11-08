using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using WeddingInvite.Core.Services;

namespace WeddingInvite.API.Controllers;

[ApiController]
[Authorize(Roles = "SUPER_ADMIN")]
[Route("api/template/{templateId:int}/studio/captures")]
public class TemplateCaptureController(TemplateCaptureService captures) : ControllerBase
{
    private string Owner => User.FindFirstValue(ClaimTypes.Email) ?? User.FindFirstValue("email")
        ?? throw new UnauthorizedAccessException();

    [HttpPost]
    [EnableRateLimiting("public-upload")]
    [RequestSizeLimit(8_000_000)]
    public Task<IActionResult> Start(int templateId, [FromBody(EmptyBodyBehavior = Microsoft.AspNetCore.Mvc.ModelBinding.EmptyBodyBehavior.Allow)] CapturePreviewSnapshot? snapshot = null)
        => Run(() => captures.StartAsync(templateId, Owner, snapshot));

    [HttpGet("{id:guid}")]
    public Task<IActionResult> Status(int templateId, Guid id) => Run(() => captures.GetAsync(templateId, id, Owner));

    [HttpGet("{id:guid}/image")]
    public async Task<IActionResult> Image(int templateId, Guid id)
    {
        try
        {
            Response.Headers.CacheControl = "no-store";
            return File(await captures.GetImageAsync(templateId, id, Owner), "image/png");
        }
        catch (KeyNotFoundException e) { return NotFound(new { message = e.Message }); }
        catch (UnauthorizedAccessException) { return Forbid(); }
    }

    [HttpDelete("{id:guid}")]
    public Task<IActionResult> Cancel(int templateId, Guid id) => Run(async () => { await captures.CancelAsync(templateId, id, Owner); return true; });

    [HttpPost("{id:guid}/apply")]
    public Task<IActionResult> Apply(int templateId, Guid id) => Run(() => captures.ApplyAsync(templateId, id, Owner));

    private async Task<IActionResult> Run<T>(Func<Task<T>> action)
    {
        try { Response.Headers.CacheControl = "no-store"; return Ok(await action()); }
        catch (CaptureUnavailableException e) { return StatusCode(503, new { message = e.Message }); }
        catch (KeyNotFoundException e) { return NotFound(new { message = e.Message }); }
        catch (UnauthorizedAccessException) { return Forbid(); }
        catch (ArgumentException e) { return BadRequest(new { message = e.Message }); }
        catch (DbUpdateException) { return Conflict(new { message = "Capture changed in another session. Please retry." }); }
        catch (InvalidOperationException e) { return Conflict(new { message = e.Message }); }
    }
}
