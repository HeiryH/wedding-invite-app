// using Microsoft.AspNetCore.Mvc;
// using WeddingInvite.Core.DTOs;
// using WeddingInvite.Core.Services;

// namespace WeddingInvite.API.Controllers
// {
//     [ApiController]
//     [Route("api/admin")]
//     public class SuperAdminController : ControllerBase
//     {
//         private readonly IWeddingService _weddingService;
//         private readonly IWeddingFeatureService _featureService;

//         public SuperAdminController(IWeddingService weddingService, IWeddingFeatureService featureService)
//         {
//             _weddingService = weddingService;
//             _featureService = featureService;
//         }

//         // [HttpPost("weddings/{id}/set-template")]
//         // public async Task<ActionResult> SetTemplate(int id, [FromBody] int templateId)
//         // {
//         //     var wedding = await _context.Weddings.FindAsync(id);
//         //     if (wedding == null) return NotFound();

//         //     wedding.TemplateId = templateId;
//         //     await _context.SaveChangesAsync();

//         //     return Ok(new { message = $"Wedding {id} updated to template {templateId}" });
//         // }

//         // --- WEDDING MANAGEMENT ---

//         [HttpGet("weddings")]
//         public async Task<ActionResult> GetAllWeddings() => Ok(await _weddingService.GetAllAsync());

//         [HttpPost("weddings/{id}/status")]
//         public async Task<ActionResult> SetWeddingStatus(int id, [FromBody] bool isActive)
//         {
//             // Logic to suspend/activate a wedding account
//             var wedding = await _weddingService.GetByIdAsync(id);
//             if (wedding == null) return NotFound();
            
//             // You would add a ToggleActive method to your WeddingService
//             return Ok();
//         }

//         // --- FEATURE & TIER MANAGEMENT ---

//         [HttpPost("weddings/{id}/apply-tier")]
//         public async Task<ActionResult> ApplyTier(int id, [FromBody] List<ToggleFeatureDto> tierFeatures)
//         {
//             // Example: "Gold Tier" enables Gallery, RSVP, and Wishes
//             await _featureService.BulkToggleFeaturesAsync(id, tierFeatures);
//             return Ok(new { message = "Tier applied successfully" });
//         }

//         // --- TEMPLATE MANAGEMENT ---

//         [HttpPost("templates/upload")]
//         public async Task<ActionResult> UploadNewTemplate([FromForm] IFormFile templateFile)
//         {
//             // Logic to save new template metadata and files to the server
//             // This would allow you to add "Boho", "Modern", or "Classic" themes dynamically
//             return Ok(new { message = "Template uploaded" });
//         }
//     }
// }