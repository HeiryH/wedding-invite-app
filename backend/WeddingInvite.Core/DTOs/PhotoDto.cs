using Microsoft.AspNetCore.Http;

namespace WeddingInvite.Core.DTOs
{
    public class PhotoDto
    {
        public int PhotoId { get; set; }
        public int WeddingId { get; set; }
        public string? GuestName { get; set; }
        public string PhotoUrl { get; set; } = string.Empty;
        public string? Caption { get; set; }
        public long FileSize { get; set; }
        public string ContentType { get; set; } = string.Empty;
        public string UploadedBy { get; set; } = "GUEST";
        public int? TemplateSlot { get; set; }

        // Moderation
        public bool IsApproved { get; set; }
        public bool IsVisible { get; set; }
        public bool IsFeatured { get; set; }
        public string? RejectionReason { get; set; }
        public DateTime? ApprovedDate { get; set; }

        public DateTime CreatedDate { get; set; }
    }

    // For uploading from Photo Booth (frontend)
    public class PhotoUploadDto
    {
        public string? GuestName { get; set; }
        public string? Caption { get; set; }
        public IFormFile File { get; set; } = null!;
        public string UploadedBy { get; set; } = "GUEST";
        public int? TemplateSlot { get; set; }
    }
    
    // For creating photos (internal use)
    public class CreatePhotoDto
    {
        public string GuestName { get; set; } = string.Empty;
        public string Caption { get; set; } = string.Empty;
    }
    
    // For updating existing photos
    public class UpdatePhotoDto
    {
        public string? Caption { get; set; }
        public bool IsApproved { get; set; }
        public bool IsVisible { get; set; }
    }
    
    // For approving/rejecting photos
    public class ApprovePhotoDto
    {
        public bool IsApproved { get; set; }
        public string? RejectionReason { get; set; }
    }
    
    // For setting featured status
    public class SetFeaturedDto
    {
        public bool IsFeatured { get; set; }
    }
}