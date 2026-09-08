using WeddingInvite.Core.Constants;
using WeddingInvite.Core.DTOs;
using WeddingInvite.Core.Utilities;
using WeddingInvite.Data.Repositories;
using WeddingInvite.Models;

namespace WeddingInvite.Core.Services
{
    public class EventService : IEventService
    {
        private readonly IEventRepository _eventRepo;
        private readonly IGuestRepository _guestRepo;
        private readonly IPackageRepository _packageRepo;
        private readonly IEventFeatureRepository _eventFeatureRepo;
        private readonly ITemplateRepository _templateRepo;
        private readonly IUserRepository _userRepo;

        public EventService(
            IEventRepository eventRepo,
            IGuestRepository guestRepo,
            IPackageRepository packageRepo,
            IEventFeatureRepository eventFeatureRepo,
            ITemplateRepository templateRepo,
            IUserRepository userRepo)
        {
            _eventRepo = eventRepo;
            _guestRepo = guestRepo;
            _packageRepo = packageRepo;
            _eventFeatureRepo = eventFeatureRepo;
            _templateRepo = templateRepo;
            _userRepo = userRepo;
        }

        public async Task<EventDto?> GetByIdAsync(int id)
        {
            var evt = await _eventRepo.GetByIdAsync(id);
            if (evt == null) return null;

            return await MapToDto(evt);
        }

        public async Task<EventDto?> GetBySlugAsync(string slug)
        {
            var evt = await _eventRepo.GetBySlugAsync(slug);
            if (evt == null) return null;

            return await MapToDto(evt);
        }

        public async Task<IEnumerable<EventDto>> GetAllAsync()
        {
            var events = await _eventRepo.GetAllAsync();
            var dtos = new List<EventDto>();

            foreach (var evt in events)
            {
                dtos.Add(await MapToDto(evt));
            }

            return dtos;
        }

        public async Task<IEnumerable<EventDto>> GetByCreatorAsync(int userId)
        {
            var events = await _eventRepo.GetByCreatorIdAsync(userId);
            var dtos = new List<EventDto>();
            foreach (var evt in events)
                dtos.Add(await MapToDto(evt));
            return dtos;
        }

        public async Task<EventDto> CreateAsync(CreateEventDto createDto, int? createdByUserId = null)
        {
            // BUSINESS VALIDATION

            var eventType = string.IsNullOrWhiteSpace(createDto.EventType)
                ? Models.EventTypes.Wedding
                : createDto.EventType.ToUpperInvariant();

            // 1. Check if slug is valid (alphanumeric + hyphens only)
            if (!IsValidSlug(createDto.Slug))
            {
                throw new ArgumentException(
                    "Slug can only contain letters, numbers, and hyphens"
                );
            }

            // 2. Check if slug already exists
            if (await _eventRepo.SlugExistsAsync(createDto.Slug))
            {
                throw new ArgumentException(
                    $"Slug '{createDto.Slug}' is already taken"
                );
            }

            // 3. Check if event date is in the future
            if (createDto.EventDate < DateTime.UtcNow)
            {
                throw new ArgumentException("Event date must be in the future");
            }

            // 4. Check the naming fields required for this event type are filled
            if (!EventNaming.HasRequiredNaming(eventType, createDto.Name1, createDto.Name2, createDto.EventTitle))
            {
                var message = eventType switch
                {
                    Models.EventTypes.Wedding => "Both names are required for a wedding",
                    Models.EventTypes.Party => "A name is required",
                    Models.EventTypes.Ceremony => "An event title is required",
                    _ => "Naming details are required",
                };
                throw new ArgumentException(message);
            }

            // 5. If a template is specified, it must support this event type
            if (createDto.TemplateId > 0)
            {
                var chosenTemplate = await _templateRepo.GetByIdAsync(createDto.TemplateId);
                if (chosenTemplate == null)
                    throw new ArgumentException("Invalid template ID");

                if (!TemplateEventGate.Supports(chosenTemplate.EventTypes, eventType))
                    throw new ArgumentException(
                        $"The '{chosenTemplate.TemplateName}' template doesn't support {eventType} events.");
            }

            // All validation passed! Create the event
            var evt = new Event
            {
                Slug = createDto.Slug.ToLower().Trim(),
                EventType = eventType,
                Name1 = createDto.Name1?.Trim(),
                Name2 = createDto.Name2?.Trim(),
                EventTitle = createDto.EventTitle?.Trim(),
                EventDate = createDto.EventDate,
                Venue = createDto.Venue.Trim(),
                VenueAddress = createDto.VenueAddress.Trim(),
                TemplateId = createDto.TemplateId,
                IsActive = true,
                CreatedDate = DateTime.UtcNow,
                CreatedByUserId = createdByUserId,
            };

            var created = await _eventRepo.CreateAsync(evt);

            // A new wedding started with every EventFeature off regardless of the owner's tier —
            // the couple/host had to manually re-toggle RSVP/Wishes/Photo Booth/etc every time.
            // Seed everything the owner's tier already entitles them to (falls back to BASIC for a
            // super-admin-created event with no owner, or one whose owner's tier lookup fails).
            var ownerTier = createdByUserId.HasValue
                ? (await _userRepo.GetByIdAsync(createdByUserId.Value))?.Tier
                : null;
            await TierFeatureSync.SyncEnabledFeaturesAsync(created.EventId, ownerTier, _packageRepo, _eventFeatureRepo);

            return await MapToDto(created);
        }

        public async Task<EventDto> UpdateAsync(int id, UpdateEventDto updateDto)
        {
            var evt = await _eventRepo.GetByIdAsync(id);
            if (evt == null)
                throw new KeyNotFoundException($"Event with ID {id} not found");

            evt.Name1 = updateDto.Name1?.Trim();
            evt.Name2 = updateDto.Name2?.Trim();
            evt.EventTitle = updateDto.EventTitle?.Trim();
            evt.EventDate = updateDto.EventDate;
            evt.Venue = updateDto.Venue;
            evt.VenueAddress = updateDto.VenueAddress;
            evt.MaxPax = updateDto.MaxPax;
            evt.MaxCapacity = updateDto.MaxCapacity;
            evt.ShowCapacityWarning = updateDto.ShowCapacityWarning;

            var baseSlug = SlugGenerator.GenerateBaseSlug(evt.EventType, updateDto.Name1, updateDto.Name2, updateDto.EventTitle);

            // Regenerating the slug on every save could collide with another event — auto-suffix
            // rather than fail (mirrors AuthController.SelfRegister's retry loop), guarding against
            // comparing the event against its own unchanged slug so a no-op update doesn't false-positive.
            var slug = baseSlug;
            var suffix = 2;
            while (await _eventRepo.SlugExistsAsync(slug) && !string.Equals(slug, evt.Slug, StringComparison.Ordinal))
                slug = $"{baseSlug}-{suffix++}";

            evt.Slug = slug;

            await _eventRepo.UpdateAsync(evt);
            return await MapToDto(evt);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            // A real, permanent delete — matches the "cannot be undone" confirmation in the admin UI.
            // Cascades (Guests, Wishes, Photos, EventFeatures, Tables, ItineraryItems,
            // EventTemplateConfig) are configured OnDelete(Cascade) in AppDbContext, and the couple
            // admin's User.EventId is SetNull, so this cleans up in one transaction. To deactivate an
            // event without deleting it, use ToggleActiveAsync (IsActive) instead.
            var deleted = await _eventRepo.DeleteAsync(id);
            if (!deleted) return false;

            // Best-effort: the DB delete already committed, so a filesystem hiccup here must not
            // surface as a failed request. wwwroot/uploads/{id}/ covers Couple+Guest photos (incl.
            // Adjust-panel layer images/backgrounds) and uploaded audio — all per-event-subfoldered.
            // wwwroot/uploads/photos/{id}/ is a legacy path from an older upload flow, cleaned up
            // defensively. wwwroot/uploads/templates/ is shared across events — never touched.
            TryDeleteDirectory(Path.Combine("wwwroot", "uploads", id.ToString()));
            TryDeleteDirectory(Path.Combine("wwwroot", "uploads", "photos", id.ToString()));

            return true;
        }

        private static void TryDeleteDirectory(string path)
        {
            try
            {
                if (Directory.Exists(path))
                    Directory.Delete(path, recursive: true);
            }
            catch
            {
                // Best-effort cleanup; the DB delete already succeeded.
            }
        }

        public async Task<EventDto> UpdateTemplateAsync(int id, int templateId)
        {
            var evt = await _eventRepo.GetByIdAsync(id);

            if (evt == null)
                throw new KeyNotFoundException($"Event with ID {id} not found");

            if (templateId < 1)
                throw new ArgumentException("Invalid template ID");

            var template = await _templateRepo.GetByIdAsync(templateId);
            if (template == null)
                throw new ArgumentException("Invalid template ID");

            if (!TemplateEventGate.Supports(template.EventTypes, evt.EventType))
                throw new ArgumentException(
                    $"The '{template.TemplateName}' template doesn't support {evt.EventType} events.");

            // Tier ceiling: an event can only adopt a template within its tier.
            var owner = await _userRepo.GetByEventIdAsync(id);
            var tier = owner?.Tier ?? TierEntitlements.Basic;
            if (!TierEntitlements.AllowsTemplateTier(tier, template.Tier))
                throw new InvalidOperationException(
                    $"The '{template.TemplateName}' template isn't available on the {tier} tier. Upgrade the event to use it.");

            evt.TemplateId = templateId;

            var updated = await _eventRepo.UpdateAsync(evt);

            // No config seeding on switch: the template's captured "starting design" is applied live at
            // read time (TemplateConfigService.GetConfigAsync), so simply changing TemplateId makes the
            // invite inherit that template's default for every key the couple hasn't overridden.
            return await MapToDto(updated);
        }

        public async Task<EventDto> ToggleActiveAsync(int id, bool isActive)
        {
            var evt = await _eventRepo.GetByIdAsync(id);
            if (evt == null)
                throw new KeyNotFoundException($"Event with ID {id} not found");

            evt.IsActive = isActive;
            var updated = await _eventRepo.UpdateAsync(evt);

            return await MapToDto(updated);
        }

        public async Task<EventDto> ToggleRsvpAsync(int id, bool isRsvpOpen)
        {
            var evt = await _eventRepo.GetByIdAsync(id);
            if (evt == null)
                throw new KeyNotFoundException($"Event with ID {id} not found");

            evt.IsRsvpOpen = isRsvpOpen;
            var updated = await _eventRepo.UpdateAsync(evt);

            return await MapToDto(updated);
        }

        public async Task<EventDto> SetDomainAsync(int id, string? domain)
        {
            var evt = await _eventRepo.GetByIdAsync(id);
            if (evt == null)
                throw new KeyNotFoundException($"Event with ID {id} not found");

            // Clearing the domain (back to the platform URL) is always allowed.
            if (string.IsNullOrWhiteSpace(domain))
            {
                evt.Domain = null;
                var cleared = await _eventRepo.UpdateAsync(evt);
                return await MapToDto(cleared);
            }

            var normalized = NormalizeDomain(domain);
            if (!IsValidDomain(normalized))
                throw new ArgumentException("Enter a valid domain, e.g. 'john-and-mary.com'.");

            // Custom domain is a PRO-tier entitlement AND must be explicitly enabled for this
            // event (same two-step gate as PHOTO_BOOTH/SEATING) — see EventFeatureService.
            var owner = await _userRepo.GetByEventIdAsync(id);
            var tier = owner?.Tier ?? TierEntitlements.Basic;
            if (!await _packageRepo.TierIncludesFeatureAsync(tier, FeatureCodes.CustomDomain))
                throw new InvalidOperationException(
                    $"Custom domains are a PRO feature. This event is on the {tier} tier.");
            if (!await _eventFeatureRepo.IsFeatureEnabledAsync(id, FeatureCodes.CustomDomain))
                throw new InvalidOperationException(
                    "Custom domain isn't enabled for this event yet. Ask your admin to turn it on in Features.");

            // Globally unique across events.
            var existing = await _eventRepo.GetByDomainAsync(normalized);
            if (existing != null && existing.EventId != id)
                throw new ArgumentException($"The domain '{normalized}' is already in use.");

            evt.Domain = normalized;
            var updated = await _eventRepo.UpdateAsync(evt);
            return await MapToDto(updated);
        }

        public async Task<EventDto?> GetByDomainAsync(string domain)
        {
            var evt = await _eventRepo.GetByDomainAsync(NormalizeDomain(domain));
            return evt == null ? null : await MapToDto(evt);
        }

        // Strip scheme / path / leading www and lower-case, so "https://WWW.Foo.com/" → "foo.com".
        private static string NormalizeDomain(string domain)
        {
            var d = domain.Trim().ToLowerInvariant();
            d = System.Text.RegularExpressions.Regex.Replace(d, "^https?://", "");
            d = d.Split('/')[0];
            if (d.StartsWith("www.")) d = d.Substring(4);
            return d.TrimEnd('.');
        }

        private static bool IsValidDomain(string domain)
        {
            if (domain.Length > 253) return false;
            // one or more DNS labels, then a 2+ letter TLD
            return System.Text.RegularExpressions.Regex.IsMatch(
                domain,
                @"^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$");
        }

        // HELPER METHODS

        private async Task<EventDto> MapToDto(Event evt)
        {
            // Reload to get latest navigation props if needed
            var totalAttending = await _guestRepo.GetAttendingCountByEventIdAsync(evt.EventId);
            var daysUntil = (evt.EventDate - DateTime.UtcNow).Days;
            var owner = await _userRepo.GetByEventIdAsync(evt.EventId);

            return new EventDto
            {
                EventId = evt.EventId,
                Slug = evt.Slug,
                EventType = evt.EventType,
                Name1 = evt.Name1,
                Name2 = evt.Name2,
                EventTitle = evt.EventTitle,
                DisplayName = EventNaming.GetDisplayName(evt.EventType, evt.Name1, evt.Name2, evt.EventTitle),
                EventDate = evt.EventDate,
                Venue = evt.Venue,
                VenueAddress = evt.VenueAddress,
                TotalGuests = evt.Guests.Count,
                TotalAttending = totalAttending,
                DaysUntilEvent = daysUntil > 0 ? daysUntil : 0,
                TotalPhotos = evt.Photos.Count,
                EnabledFeaturesCount = evt.EventFeatures.Count(ef => ef.IsEnabled),
                IsActive = evt.IsActive,
                IsRsvpOpen = evt.IsRsvpOpen,
                IsPublic = evt.IsPublic,
                MaxPax = evt.MaxPax,
                MaxCapacity = evt.MaxCapacity,
                ShowCapacityWarning = evt.ShowCapacityWarning,
                TemplateId = evt.TemplateId,
                TemplateName = evt.Template?.TemplateName,
                TemplateCode = evt.Template?.TemplateCode,
                CreatedByUserId = evt.CreatedByUserId,
                CreatedByEmail = evt.CreatedBy?.Email,
                Domain = evt.Domain,
                OwnerTier = owner?.Tier ?? TierEntitlements.Basic
            };
        }

        public async Task<int> PruneStalePrivateAsync(int daysOld)
        {
            var cutoff = DateTime.UtcNow.AddDays(-daysOld);
            var stale = await _eventRepo.GetStalePrivateAsync(cutoff);
            var count = 0;
            foreach (var e in stale)
            {
                await _eventRepo.HardDeleteAsync(e.EventId);
                count++;
            }
            return count;
        }

        private bool IsValidSlug(string slug)
        {
            return System.Text.RegularExpressions.Regex.IsMatch(
                slug,
                @"^[a-zA-Z0-9-]+$"
            );
        }
    }
}
