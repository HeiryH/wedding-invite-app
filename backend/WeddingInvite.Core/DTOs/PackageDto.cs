namespace WeddingInvite.Core.DTOs
{
    public class PackageDto
    {
        public int PackageId { get; set; }
        public string PackageName { get; set; } = string.Empty;
        public string PackageCode { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public bool IsActive { get; set; }
        public int SortOrder { get; set; }
        public List<FeatureDto> Features { get; set; } = new List<FeatureDto>();
    }

    public class CreatePackageDto
    {
        public string PackageName { get; set; } = string.Empty;
        public string PackageCode { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public int SortOrder { get; set; }
        public List<int> FeatureIds { get; set; } = new List<int>();
    }

    public class UpdatePackageDto
    {
        public string PackageName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public bool IsActive { get; set; }
        public int SortOrder { get; set; }
        public List<int> FeatureIds { get; set; } = new List<int>();
    }

    public class AssignPackageDto
    {
        public int PackageId { get; set; }
    }
}
