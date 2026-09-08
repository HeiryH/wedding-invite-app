using WeddingInvite.Data.Repositories;

namespace WeddingInvite.Core.Utilities
{
    /// <summary>
    /// Reconciles an event's toggleable <c>EventFeature</c> rows with what its owner's tier
    /// actually entitles them to (Package/PackageFeature — see
    /// IPackageRepository.TierIncludesFeatureAsync). Used at event-creation time
    /// (EventService.CreateAsync) and whenever an admin changes a user's tier
    /// (AuthService.SetTierAsync) — both need the tier and the per-wedding toggles to actually
    /// stay in sync, which is what was missing: a new or upgraded PRO wedding started with every
    /// feature off regardless of tier, and a downgrade left every previously-unlocked feature on
    /// forever, because nothing ever revoked what a lower tier no longer includes.
    ///
    /// Two different rules for the two directions, not one blanket "match the tier exactly":
    /// - A feature the new tier does NOT include is force-disabled, even if it was on — the couple
    ///   is no longer entitled to it, full stop. This is what makes a downgrade actually downgrade.
    /// - A feature the new tier DOES include is only seeded (created, enabled) when the event has
    ///   no row for it at all. An existing row — on or off — is left exactly as it is, so a
    ///   deliberate manual toggle-off (e.g. a PRO couple who doesn't want photo booth) survives a
    ///   later re-sync at the same or a higher tier, and a feature a couple re-enables after a
    ///   downgrade-then-upgrade round-trip isn't silently forced back on by this method alone.
    /// </summary>
    public static class TierFeatureSync
    {
        public static async Task SyncEnabledFeaturesAsync(
            int eventId,
            string? tier,
            IPackageRepository packageRepo,
            IEventFeatureRepository eventFeatureRepo)
        {
            var package = await packageRepo.GetByCodeAsync((tier ?? "BASIC").ToUpperInvariant());
            var allowedFeatureIds = package?.PackageFeatures.Select(pf => pf.FeatureId).ToHashSet() ?? new HashSet<int>();

            // Revoke anything the new tier doesn't include, regardless of its current state.
            var existingRows = await eventFeatureRepo.GetByEventIdAsync(eventId);
            foreach (var row in existingRows)
            {
                if (row.IsEnabled && !allowedFeatureIds.Contains(row.FeatureId))
                {
                    await eventFeatureRepo.DisableFeatureAsync(eventId, row.FeatureId);
                }
            }

            // Seed anything newly (or still) allowed that the event has never had a row for.
            var existingFeatureIds = existingRows.Select(r => r.FeatureId).ToHashSet();
            foreach (var featureId in allowedFeatureIds)
            {
                if (!existingFeatureIds.Contains(featureId))
                {
                    await eventFeatureRepo.EnableFeatureAsync(eventId, featureId);
                }
            }
        }
    }
}
