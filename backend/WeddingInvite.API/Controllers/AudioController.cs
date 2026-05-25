using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace WeddingInvite.API.Controllers;

[ApiController]
[Route("api/audio")]
[Authorize]
public class AudioController : ControllerBase
{
    private static readonly string[] AllowedExtensions = { ".mp3", ".ogg", ".wav", ".aac", ".m4a", ".flac" };
    private const long MaxFileSizeBytes = 20 * 1024 * 1024; // 20 MB

    [HttpPost("wedding/{weddingId}")]
    public async Task<IActionResult> Upload(int weddingId, [FromForm] IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { message = "Audio file is required" });

        if (file.Length > MaxFileSizeBytes)
            return BadRequest(new { message = "File size cannot exceed 20 MB" });

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(extension))
            return BadRequest(new { message = $"Allowed formats: {string.Join(", ", AllowedExtensions)}" });

        if (!file.ContentType.StartsWith("audio/"))
            return BadRequest(new { message = "Only audio files are allowed" });

        var uploadsFolder = Path.Combine("wwwroot", "uploads", weddingId.ToString(), "audio");
        Directory.CreateDirectory(uploadsFolder);

        var uniqueFileName = $"{Guid.NewGuid()}{extension}";
        var filePath = Path.Combine(uploadsFolder, uniqueFileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var audioUrl = $"/uploads/{weddingId}/audio/{uniqueFileName}";
        return Ok(new { audioUrl });
    }
}
