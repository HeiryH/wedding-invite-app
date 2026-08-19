using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WeddingInvite.Data.Migrations
{
    /// <summary>
    /// Data-only backfill: grant CUSTOM_DOMAIN (FeatureId 3) to every event that already has a
    /// Domain set.
    ///
    /// Custom domain is gated twice — the PRO tier ceiling *and* an explicit per-event
    /// EventFeature toggle (same two-step gate as PHOTO_BOOTH/SEATING). Events whose domain was
    /// configured before that toggle existed have no EventFeature row, so without this backfill
    /// they'd silently fail the second gate and lose their working custom domain.
    ///
    /// Carried over from the superseded 20260723135311_UnifyTierGatingUnderPackages, whose schema
    /// operations were duplicated by 20260726123038_AddTemplateConfigDefaultAndPackageTierUnification
    /// but whose backfill had no equivalent there. Re-expressed against the post-rename table names
    /// (Events/EventFeatures), since it now runs after 20260802073235_RenameWeddingToEvent.
    ///
    /// Idempotent via NOT EXISTS — safe to re-run, and a no-op on databases that already applied
    /// the original migration.
    /// </summary>
    public partial class BackfillCustomDomainFeature : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                INSERT INTO EventFeatures (EventId, FeatureId, IsEnabled, EnabledDate)
                SELECT e.EventId, 3, 1, CURRENT_TIMESTAMP
                FROM Events e
                WHERE e.Domain IS NOT NULL
                  AND NOT EXISTS (
                      SELECT 1 FROM EventFeatures ef
                      WHERE ef.EventId = e.EventId AND ef.FeatureId = 3
                  );
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Intentionally not reversed: the rows are indistinguishable from a toggle the admin
            // enabled by hand, and dropping them would revoke a live custom domain.
        }
    }
}
