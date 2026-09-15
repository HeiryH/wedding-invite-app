using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WeddingInvite.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddDreamyWoodlandTemplate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // WEDDING, Classic family (flow + overlay), PREMIUM tier. Kept as raw InsertData
            // rather than AppDbContext HasData, matching Templates 5/8/9/10/11 and avoiding
            // unrelated model-snapshot seed churn for a catalog-only addition.
            migrationBuilder.InsertData(
                table: "Templates",
                columns: new[] { "TemplateId", "ComponentPath", "CreatedDate", "Description", "EventTypes", "IsActive", "IsPremium", "PrimaryColor", "SecondaryColor", "SortOrder", "TemplateCode", "TemplateName", "ThumbnailUrl", "Tier" },
                values: new object[] { 12, "Template12", new DateTime(2026, 9, 15, 0, 0, 0, 0, DateTimeKind.Utc), "Vintage screen-printed woodland wedding invitation with a continuous pink-cloud background and animated botanical scenery -- Classic family (flow + overlay), authored through the Codex e-invite workflow", "WEDDING", true, true, "#007F78", "#ED7F93", 12, "dreamy-woodland", "Dreamy Woodland", "", "PREMIUM" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 12);
        }
    }
}
