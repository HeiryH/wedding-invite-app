namespace WeddingInvite.Core.DTOs
{
    public class PhotoDto
    {
        public int PhotoId { get; set; }
        public int WeddingId { get; set; }
        public string GuestName { get; set; } = string.Empty;
        public string FileName { get; set; } = string.Empty;
        public string PhotoUrl { get; set; } = string.Empty; // Public URL to access photo
        public long FileSize { get; set; }
        public string Caption { get; set; } = string.Empty;
        public bool IsApproved { get; set; }
        public bool IsVisible { get; set; }
        public DateTime UploadedDate { get; set; }
    }
    
    public class CreatePhotoDto
    {
        public string GuestName { get; set; } = string.Empty;
        public string Caption { get; set; } = string.Empty;
        // Note: File will be sent as multipart/form-data, handled separately
    }
    
    public class UpdatePhotoDto
    {
        public string Caption { get; set; } = string.Empty;
        public bool IsApproved { get; set; }
        public bool IsVisible { get; set; }
    }
}