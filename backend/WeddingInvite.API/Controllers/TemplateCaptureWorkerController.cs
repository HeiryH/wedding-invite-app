using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WeddingInvite.Core.Services;

namespace WeddingInvite.API.Controllers;

// The renderer can claim jobs and upload temporary results; it cannot approve a thumbnail,
// access drafts, or impersonate a Super Admin. Its shared key is separate from JWT secrets.
[ApiController]
[AllowAnonymous]
[Route("api/template-capture-worker")]
public class TemplateCaptureWorkerController(TemplateCaptureService captures, IConfiguration configuration) : ControllerBase
{
    public record LeaseRequest(string LeaseToken);
    private bool Allowed()
    {
        var expected = configuration["TemplateCapture:WorkerKey"];
        var supplied = Request.Headers["X-Capture-Worker-Key"].ToString();
        return expected?.Length >= 32 && supplied.Length == expected.Length &&
            CryptographicOperations.FixedTimeEquals(Encoding.UTF8.GetBytes(expected), Encoding.UTF8.GetBytes(supplied));
    }

    [HttpPost("claim")]
    public async Task<IActionResult> Claim()
    {
        if (!Allowed()) return Unauthorized();
        var job = await captures.ClaimAsync();
        return job == null ? NoContent() : Ok(job);
    }

    [HttpPost("heartbeat")]
    public IActionResult Heartbeat()
    {
        if (!Allowed()) return Unauthorized();
        captures.Heartbeat();
        return NoContent();
    }

    [HttpPost("{id:guid}/complete")]
    [RequestSizeLimit(9 * 1024 * 1024)]
    public async Task<IActionResult> Complete(Guid id, [FromForm] string leaseToken, [FromForm] IFormFile file)
    {
        if (!Allowed()) return Unauthorized();
        return await Run(() => captures.CompleteAsync(id, leaseToken, file));
    }

    [HttpPost("{id:guid}/fail")]
    public async Task<IActionResult> Fail(Guid id, LeaseRequest request)
    {
        if (!Allowed()) return Unauthorized();
        return await Run(() => captures.FailAsync(id, request.LeaseToken));
    }

    private async Task<IActionResult> Run(Func<Task> action)
    {
        try { await action(); return NoContent(); }
        catch (KeyNotFoundException) { return NotFound(); }
        catch (ArgumentException e) { return BadRequest(new { message = e.Message }); }
        catch (DbUpdateConcurrencyException) { return Conflict(new { message = "Capture was cancelled or changed." }); }
        catch (InvalidOperationException e) { return Conflict(new { message = e.Message }); }
    }
}
