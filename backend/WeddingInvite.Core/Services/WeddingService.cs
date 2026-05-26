using WeddingInvite.Core.DTOs;
using WeddingInvite.Data.Repositories;
using WeddingInvite.Models;

namespace WeddingInvite.Core.Services
{
    public class WeddingService : IWeddingService
    {
        private readonly IWeddingRepository _weddingRepo;
        private readonly IGuestRepository _guestRepo;
        private readonly IPackageRepository _packageRepo;
        private readonly IWeddingFeatureRepository _weddingFeatureRepo;

        public WeddingService(
            IWeddingRepository weddingRepo,
            IGuestRepository guestRepo,
            IPackageRepository packageRepo,
            IWeddingFeatureRepository weddingFeatureRepo)
        {
            _weddingRepo = weddingRepo;
            _guestRepo = guestRepo;
            _packageRepo = packageRepo;
            _weddingFeatureRepo = weddingFeatureRepo;
        }

        public async Task<WeddingDto?> GetByIdAsync(int id)
        {
            var wedding = await _weddingRepo.GetByIdAsync(id);
            if (wedding == null) return null;

            return await MapToDto(wedding);
        }

        public async Task<WeddingDto?> GetByCoupleNameAsync(string coupleName)
        {
            var wedding = await _weddingRepo.GetByCoupleNameAsync(coupleName);
            if (wedding == null) return null;

            return await MapToDto(wedding);
        }

        public async Task<IEnumerable<WeddingDto>> GetAllAsync()
        {
            var weddings = await _weddingRepo.GetAllAsync();
            var dtos = new List<WeddingDto>();

            foreach (var wedding in weddings)
            {
                dtos.Add(await MapToDto(wedding));
            }

            return dtos;
        }

        public async Task<WeddingDto> CreateAsync(CreateWeddingDto createDto)
        {
            // BUSINESS VALIDATION

            // 1. Check if couple name is valid (alphanumeric + hyphens only)
            if (!IsValidCoupleName(createDto.CoupleName))
            {
                throw new ArgumentException(
                    "Couple name can only contain letters, numbers, and hyphens"
                );
            }

            // 2. Check if couple name already exists
            if (await _weddingRepo.CoupleNameExistsAsync(createDto.CoupleName))
            {
                throw new ArgumentException(
                    $"Couple name '{createDto.CoupleName}' is already taken"
                );
            }

            // 3. Check if wedding date is in the future
            if (createDto.WeddingDate < DateTime.UtcNow)
            {
                throw new ArgumentException("Wedding date must be in the future");
            }

            // 4. Check if required fields are filled
            if (string.IsNullOrWhiteSpace(createDto.BrideName))
                throw new ArgumentException("Bride name is required");

            if (string.IsNullOrWhiteSpace(createDto.GroomName))
                throw new ArgumentException("Groom name is required");

            // All validation passed! Create the wedding
            var wedding = new Wedding
            {
                CoupleName = createDto.CoupleName.ToLower().Trim(),
                BrideName = createDto.BrideName.Trim(),
                GroomName = createDto.GroomName.Trim(),
                WeddingDate = createDto.WeddingDate,
                Venue = createDto.Venue.Trim(),
                VenueAddress = createDto.VenueAddress.Trim(),
                TemplateId = createDto.TemplateId,
                PackageId = createDto.PackageId,
                IsActive = true,
                CreatedDate = DateTime.UtcNow,
            };

            var created = await _weddingRepo.CreateAsync(wedding);

            // Auto-enable features from the selected package
            if (createDto.PackageId.HasValue)
            {
                await EnablePackageFeaturesAsync(created.WeddingId, createDto.PackageId.Value);
            }

            return await MapToDto(created);
        }

        public async Task<WeddingDto> UpdateAsync(int id, UpdateWeddingDto updateDto)
        {
            var wedding = await _weddingRepo.GetByIdAsync(id);
            if (wedding == null)
                throw new KeyNotFoundException($"Wedding with ID {id} not found");

            wedding.BrideName = updateDto.BrideName;
            wedding.GroomName = updateDto.GroomName;
            wedding.WeddingDate = updateDto.WeddingDate;
            wedding.Venue = updateDto.Venue;
            wedding.VenueAddress = updateDto.VenueAddress;
            wedding.MaxPax = updateDto.MaxPax;

            wedding.CoupleName = GenerateCoupleName(updateDto.BrideName, updateDto.GroomName);

            await _weddingRepo.UpdateAsync(wedding);
            return await MapToDto(wedding);
        }

        private string GenerateCoupleName(string brideName, string groomName)
        {
            var bride = brideName.Split(' ')[0].ToLower();
            var groom = groomName.Split(' ')[0].ToLower();
            return $"{bride}-{groom}";
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var wedding = await _weddingRepo.GetByIdAsync(id);
            if (wedding == null) return false;

            wedding.IsActive = false;
            await _weddingRepo.UpdateAsync(wedding);

            return true;
        }

        public async Task<WeddingDto> UpdateTemplateAsync(int id, int templateId)
        {
            var wedding = await _weddingRepo.GetByIdAsync(id);

            if (wedding == null)
                throw new KeyNotFoundException($"Wedding with ID {id} not found");

            if (templateId < 1)
                throw new ArgumentException("Invalid template ID");

            wedding.TemplateId = templateId;

            var updated = await _weddingRepo.UpdateAsync(wedding);

            return await MapToDto(updated);
        }

        public async Task<WeddingDto> UpdatePackageAsync(int id, int packageId)
        {
            var wedding = await _weddingRepo.GetByIdAsync(id);
            if (wedding == null)
                throw new KeyNotFoundException($"Wedding with ID {id} not found");

            var package = await _packageRepo.GetByIdAsync(packageId);
            if (package == null)
                throw new ArgumentException($"Package with ID {packageId} not found");

            wedding.PackageId = packageId;
            await _weddingRepo.UpdateAsync(wedding);

            // Auto-enable the new package's features
            await EnablePackageFeaturesAsync(id, packageId);

            return await MapToDto(wedding);
        }

        public async Task<WeddingDto> ToggleActiveAsync(int id, bool isActive)
        {
            var wedding = await _weddingRepo.GetByIdAsync(id);
            if (wedding == null)
                throw new KeyNotFoundException($"Wedding with ID {id} not found");

            wedding.IsActive = isActive;
            var updated = await _weddingRepo.UpdateAsync(wedding);

            return await MapToDto(updated);
        }

        // HELPER METHODS

        private async Task EnablePackageFeaturesAsync(int weddingId, int packageId)
        {
            var package = await _packageRepo.GetByIdAsync(packageId);
            if (package == null) return;

            foreach (var pf in package.PackageFeatures)
            {
                await _weddingFeatureRepo.EnableFeatureAsync(weddingId, pf.FeatureId);
            }
        }

        private async Task<WeddingDto> MapToDto(Wedding wedding)
        {
            // Reload to get latest navigation props if needed
            var totalAttending = await _guestRepo.GetAttendingCountByWeddingIdAsync(wedding.WeddingId);
            var daysUntil = (wedding.WeddingDate - DateTime.UtcNow).Days;

            return new WeddingDto
            {
                WeddingId = wedding.WeddingId,
                CoupleName = wedding.CoupleName,
                BrideName = wedding.BrideName,
                GroomName = wedding.GroomName,
                WeddingDate = wedding.WeddingDate,
                Venue = wedding.Venue,
                VenueAddress = wedding.VenueAddress,
                TotalGuests = wedding.Guests.Count,
                TotalAttending = totalAttending,
                DaysUntilWedding = daysUntil > 0 ? daysUntil : 0,
                TotalPhotos = wedding.Photos.Count,
                EnabledFeaturesCount = wedding.WeddingFeatures.Count(wf => wf.IsEnabled),
                IsActive = wedding.IsActive,
                MaxPax = wedding.MaxPax,
                TemplateId = wedding.TemplateId,
                TemplateName = wedding.Template?.TemplateName,
                TemplateCode = wedding.Template?.TemplateCode,
                PackageId = wedding.PackageId,
                PackageName = wedding.Package?.PackageName
            };
        }

        private bool IsValidCoupleName(string coupleName)
        {
            return System.Text.RegularExpressions.Regex.IsMatch(
                coupleName,
                @"^[a-zA-Z0-9-]+$"
            );
        }
    }
}
