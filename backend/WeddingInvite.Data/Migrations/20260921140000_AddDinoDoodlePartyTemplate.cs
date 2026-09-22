using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WeddingInvite.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddDinoDoodlePartyTemplate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // PARTY, Stage family (aspect-locked art + editable grouped slots), PREMIUM tier.
            // Kept as raw InsertData
            // rather than AppDbContext HasData, matching Templates 5/8/9/10/11 and avoiding
            // unrelated model-snapshot seed churn for a catalog-only addition.
            migrationBuilder.InsertData(
                table: "Templates",
                columns: new[] { "TemplateId", "ComponentPath", "CreatedDate", "Description", "EventTypes", "IsActive", "IsPremium", "PrimaryColor", "SecondaryColor", "SortOrder", "TemplateCode", "TemplateName", "ThumbnailUrl", "Tier" },
                values: new object[] { 13, "Template13", new DateTime(2026, 9, 21, 0, 0, 0, 0, DateTimeKind.Utc), "Premium Jurassic expedition birthday invitation with six illustrated jungle stages, editable grouped content, parallax props, RSVP, wishes, seating, and photo booth", "PARTY", true, true, "#173F33", "#A84227", 13, "dino-doodle-party", "Dino Doodle Party", "", "PREMIUM" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 13);
        }
    }
}
