namespace WeddingInvite.Models
{
    public class Package
    {
        public int PackageId { get; set; }

        // Tier definition: PackageCode is one of BASIC / PREMIUM / PRO — the same vocabulary as
        // User.Tier / Template.Tier. PackageName/Description/Price are display-only; the
        // PackageFeatures below are the actual source of truth for what the tier unlocks.
        public string PackageName { get; set; } = string.Empty; // "Basic", "Premium", "Pro"
        public string PackageCode { get; set; } = string.Empty; // "BASIC", "PREMIUM", "PRO"
        public string Description { get; set; } = string.Empty;

        public decimal Price { get; set; } = 0; // Display price

        public bool IsActive { get; set; } = true;
        public int SortOrder { get; set; } = 0;

        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        // Navigation property - which features are included
        public ICollection<PackageFeature> PackageFeatures { get; set; } = new List<PackageFeature>();
    }
}
