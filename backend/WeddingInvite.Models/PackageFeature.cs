namespace WeddingInvite.Models
{
    public class PackageFeature
    {
        public int PackageFeatureId { get; set; }

        public int PackageId { get; set; }
        public Package Package { get; set; } = null!;

        public int FeatureId { get; set; }
        public Feature Feature { get; set; } = null!;
    }
}
