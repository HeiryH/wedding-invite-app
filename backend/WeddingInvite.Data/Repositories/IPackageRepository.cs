using WeddingInvite.Models;

namespace WeddingInvite.Data.Repositories
{
    public interface IPackageRepository
    {
        Task<Package?> GetByIdAsync(int id);
        Task<Package?> GetByCodeAsync(string code);
        Task<IEnumerable<Package>> GetAllAsync();
        Task<IEnumerable<Package>> GetActiveAsync();
        Task<Package> CreateAsync(Package package);
        Task<Package> UpdateAsync(Package package);
        Task<bool> DeleteAsync(int id);
        Task<bool> NameExistsAsync(string name, int? excludeId = null);
        Task<bool> CodeExistsAsync(string code, int? excludeId = null);

        /// <summary>
        /// True if the tier's package (PackageCode == tier, case-insensitive) includes the given
        /// feature. This is the single source of truth for "does this tier unlock this feature" —
        /// replaces the old hardcoded TierEntitlements.FeatureMinRank dictionary. A tier with no
        /// matching package, or a feature not listed in it, is denied (fail closed).
        /// </summary>
        Task<bool> TierIncludesFeatureAsync(string? tier, string featureCode);
    }
}
