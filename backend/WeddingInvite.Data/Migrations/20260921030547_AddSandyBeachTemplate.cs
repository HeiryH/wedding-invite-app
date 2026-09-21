using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WeddingInvite.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddSandyBeachTemplate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // WEDDING, Stage family (fixed-stage compositor, T7/T10 lineage), PRO tier. Kept as raw
            // InsertData rather than AppDbContext HasData, matching Templates 5/8/9/10/11/12 and
            // avoiding unrelated model-snapshot seed churn (the scaffolder wanted to rewrite every
            // seeded CreatedDate and the admin password hash) for a catalog-only addition.
            // TemplateId 13 is reserved by the Dino Doodle Party run (no code yet) — see
            // docs/sandy-beach-design-brief.md in the wt/sandy-beach-20260920 worktree.
            migrationBuilder.InsertData(
                table: "Templates",
                columns: new[] { "TemplateId", "ComponentPath", "CreatedDate", "Description", "EventTypes", "IsActive", "IsPremium", "PrimaryColor", "SecondaryColor", "SortOrder", "TemplateCode", "TemplateName", "ThumbnailUrl", "Tier" },
                values: new object[] { 14, "Template14", new DateTime(2026, 9, 21, 0, 0, 0, 0, DateTimeKind.Utc), "Pastel ink-and-wash beach wedding: six full-screen scenes down one shoreline — a driftwood arch at sunset, under a coconut palm, along a jetty, a rock pool, blue-hour dunes and a sand close-up — Stage family (fixed-stage compositor), authored through the e-invite pipeline", "WEDDING", true, true, "#8c6858", "#f8bfb1", 14, "sandy-beach", "Sandy Beach", "", "PRO" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 14);
        }
    }
}
