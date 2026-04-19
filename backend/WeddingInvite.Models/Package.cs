namespace WeddingInvite.Models
{
    public class Package
    {
        public int PackageId { get; set; }

        public string PackageName { get; set; } = string.Empty; // "Starter", "Premium"
        public string PackageCode { get; set; } = string.Empty; // "STARTER", "PREMIUM"
        public string Description { get; set; } = string.Empty;

        public decimal Price { get; set; } = 0; // Display price

        public bool IsActive { get; set; } = true;
        public int SortOrder { get; set; } = 0;

        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        // Navigation property - which features are included
        public ICollection<PackageFeature> PackageFeatures { get; set; } = new List<PackageFeature>();

        // Navigation property - which weddings use this package
        public ICollection<Wedding> Weddings { get; set; } = new List<Wedding>();
    }
}
