using WeddingInvite.Core.DTOs;
using WeddingInvite.Data.Repositories;
using WeddingInvite.Models;

namespace WeddingInvite.Core.Services
{
    public class PackageService : IPackageService
    {
        private readonly IPackageRepository _packageRepo;
        private readonly IFeatureRepository _featureRepo;

        public PackageService(IPackageRepository packageRepo, IFeatureRepository featureRepo)
        {
            _packageRepo = packageRepo;
            _featureRepo = featureRepo;
        }

        public async Task<PackageDto?> GetByIdAsync(int id)
        {
            var package = await _packageRepo.GetByIdAsync(id);
            return package == null ? null : MapToDto(package);
        }

        public async Task<PackageDto?> GetByCodeAsync(string code)
        {
            var package = await _packageRepo.GetByCodeAsync(code);
            return package == null ? null : MapToDto(package);
        }

        public async Task<IEnumerable<PackageDto>> GetAllAsync()
        {
            var packages = await _packageRepo.GetAllAsync();
            return packages.Select(MapToDto);
        }

        public async Task<IEnumerable<PackageDto>> GetActiveAsync()
        {
            var packages = await _packageRepo.GetActiveAsync();
            return packages.Select(MapToDto);
        }

        public async Task<PackageDto> CreateAsync(CreatePackageDto createDto)
        {
            if (string.IsNullOrWhiteSpace(createDto.PackageName))
                throw new ArgumentException("Package name is required");

            if (string.IsNullOrWhiteSpace(createDto.PackageCode))
                throw new ArgumentException("Package code is required");

            if (await _packageRepo.NameExistsAsync(createDto.PackageName))
                throw new ArgumentException($"Package name '{createDto.PackageName}' already exists");

            if (await _packageRepo.CodeExistsAsync(createDto.PackageCode))
                throw new ArgumentException($"Package code '{createDto.PackageCode}' already exists");

            var package = new Package
            {
                PackageName = createDto.PackageName.Trim(),
                PackageCode = createDto.PackageCode.ToUpper().Trim(),
                Description = createDto.Description.Trim(),
                Price = createDto.Price,
                SortOrder = createDto.SortOrder,
                IsActive = true,
                CreatedDate = DateTime.UtcNow,
            };

            var created = await _packageRepo.CreateAsync(package);

            // Add feature associations
            if (createDto.FeatureIds.Count > 0)
            {
                await AddPackageFeatures(created.PackageId, createDto.FeatureIds);
                // Reload with features
                var reloaded = await _packageRepo.GetByIdAsync(created.PackageId);
                return MapToDto(reloaded!);
            }

            return MapToDto(created);
        }

        public async Task<PackageDto> UpdateAsync(int id, UpdatePackageDto updateDto)
        {
            var package = await _packageRepo.GetByIdAsync(id);
            if (package == null)
                throw new KeyNotFoundException($"Package with ID {id} not found");

            if (string.IsNullOrWhiteSpace(updateDto.PackageName))
                throw new ArgumentException("Package name is required");

            if (await _packageRepo.NameExistsAsync(updateDto.PackageName, id))
                throw new ArgumentException($"Package name '{updateDto.PackageName}' already exists");

            package.PackageName = updateDto.PackageName.Trim();
            package.Description = updateDto.Description.Trim();
            package.Price = updateDto.Price;
            package.IsActive = updateDto.IsActive;
            package.SortOrder = updateDto.SortOrder;

            // Replace package features
            package.PackageFeatures.Clear();
            await _packageRepo.UpdateAsync(package);

            if (updateDto.FeatureIds.Count > 0)
            {
                await AddPackageFeatures(id, updateDto.FeatureIds);
            }

            var reloaded = await _packageRepo.GetByIdAsync(id);
            return MapToDto(reloaded!);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            return await _packageRepo.DeleteAsync(id);
        }

        private async Task AddPackageFeatures(int packageId, List<int> featureIds)
        {
            var package = await _packageRepo.GetByIdAsync(packageId);
            if (package == null) return;

            foreach (var featureId in featureIds.Distinct())
            {
                var feature = await _featureRepo.GetByIdAsync(featureId);
                if (feature != null)
                {
                    package.PackageFeatures.Add(new PackageFeature
                    {
                        PackageId = packageId,
                        FeatureId = featureId
                    });
                }
            }

            await _packageRepo.UpdateAsync(package);
        }

        private static PackageDto MapToDto(Package package)
        {
            return new PackageDto
            {
                PackageId = package.PackageId,
                PackageName = package.PackageName,
                PackageCode = package.PackageCode,
                Description = package.Description,
                Price = package.Price,
                IsActive = package.IsActive,
                SortOrder = package.SortOrder,
                Features = package.PackageFeatures
                    .Select(pf => new FeatureDto
                    {
                        FeatureId = pf.Feature.FeatureId,
                        FeatureCode = pf.Feature.FeatureCode,
                        FeatureName = pf.Feature.FeatureName,
                        Description = pf.Feature.Description,
                        IsPremium = pf.Feature.IsPremium,
                        IsActive = pf.Feature.IsActive,
                        SortOrder = pf.Feature.SortOrder
                    })
                    .OrderBy(f => f.SortOrder)
                    .ThenBy(f => f.FeatureName)
                    .ToList()
            };
        }
    }
}
