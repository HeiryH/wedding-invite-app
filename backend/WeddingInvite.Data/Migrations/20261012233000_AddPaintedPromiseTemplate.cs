using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using WeddingInvite.Data;

#nullable disable

namespace WeddingInvite.Data.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20261012233000_AddPaintedPromiseTemplate")]
    public partial class AddPaintedPromiseTemplate : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // WEDDING, Cinematic family (one continuous scroll-directed virtual camera), PRO tier.
            // This catalog-only migration is intentionally hand-authored without a Designer model.
            // Use raw SQL so migration execution does not require EF property mappings from a
            // generated target model (InsertData would fail before emitting any SQL).
            migrationBuilder.Sql(
                """
                INSERT INTO "Templates"
                    ("TemplateId", "ComponentPath", "CreatedDate", "Description", "EventTypes", "IsActive", "IsPremium", "PrimaryColor", "SecondaryColor", "SortOrder", "TemplateCode", "TemplateName", "ThumbnailUrl", "Tier")
                VALUES
                    (15, 'Template15', '2026-10-12 00:00:00', 'A continuous painted Muslim wedding world: the camera follows a ring fitting, Walimatul Urus, seated couple, programme board, reception table, RSVP letter, guest book and approved-photo memory arch — Cinematic family', 'WEDDING', 1, 1, '#8BCBFA', '#F6E8D7', 15, 'painted-promise', 'Painted Promise', '', 'PRO');
                """);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DELETE FROM \"Templates\" WHERE \"TemplateId\" = 15;");
        }
    }
}
