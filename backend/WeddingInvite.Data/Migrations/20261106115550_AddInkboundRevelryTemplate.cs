using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WeddingInvite.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddInkboundRevelryTemplate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Catalog-only seed, matching T13/T14: do not add HasData or retain the
            // scaffolder's unrelated timestamp/admin-hash updates. Template16.tsx
            // forwards to Template16-inkboundrevelry; ComponentPath follows existing rows.
            // Frozen intake: WEDDING / PREMIUM / A (Classic DOM flow), not PRO.
            migrationBuilder.InsertData(
                table: "Templates",
                columns: new[] { "TemplateId", "ComponentPath", "CreatedDate", "Description", "EventTypes", "IsActive", "IsAuthored", "IsPremium", "PrimaryColor", "SecondaryColor", "SortOrder", "StagesJson", "TemplateCode", "TemplateName", "ThumbnailUrl", "Tier" },
                values: new object[] { 16, "Template16", new DateTime(2026, 11, 6, 0, 0, 0, DateTimeKind.Utc), "Playful black ink and red accents on warm ivory with six flowing wedding sections and feature-gated seating and photo gallery", "WEDDING", true, false, true, "#030303", "#a00407", 16, null, "inkbound-revelry", "Inkbound Revelry", "", "PREMIUM" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyColumnType: "INTEGER",
                keyValue: 16);
        }
    }
}
