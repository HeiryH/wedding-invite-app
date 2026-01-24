namespace WeddingInvite.Core.DTOs
{
    public class WishDto
    {
        public int WishId { get; set; }
        public int WeddingId { get; set; }
        public string GuestName { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public DateTime CreatedDate { get; set; }
    }
    
    public class CreateWishDto
    {
        public string GuestName { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
    }
}