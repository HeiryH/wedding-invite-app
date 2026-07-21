using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WeddingInvite.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddTemplate7RomanGarden : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 1,
                column: "CreatedDate",
                value: new DateTime(2026, 7, 13, 15, 1, 47, 571, DateTimeKind.Utc).AddTicks(7060));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 2,
                column: "CreatedDate",
                value: new DateTime(2026, 7, 13, 15, 1, 47, 571, DateTimeKind.Utc).AddTicks(7150));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 3,
                column: "CreatedDate",
                value: new DateTime(2026, 7, 13, 15, 1, 47, 571, DateTimeKind.Utc).AddTicks(7160));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 4,
                column: "CreatedDate",
                value: new DateTime(2026, 7, 13, 15, 1, 47, 571, DateTimeKind.Utc).AddTicks(7160));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 5,
                column: "CreatedDate",
                value: new DateTime(2026, 7, 13, 15, 1, 47, 571, DateTimeKind.Utc).AddTicks(7160));

            migrationBuilder.UpdateData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 1,
                column: "CreatedDate",
                value: new DateTime(2026, 7, 13, 15, 1, 47, 574, DateTimeKind.Utc).AddTicks(4360));

            migrationBuilder.UpdateData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 2,
                column: "CreatedDate",
                value: new DateTime(2026, 7, 13, 15, 1, 47, 574, DateTimeKind.Utc).AddTicks(4450));

            migrationBuilder.InsertData(
                table: "Templates",
                columns: new[] { "TemplateId", "ComponentPath", "CreatedDate", "Description", "IsActive", "IsPremium", "PrimaryColor", "SecondaryColor", "SortOrder", "TemplateCode", "TemplateName", "ThumbnailUrl", "Tier" },
                values: new object[] { 7, "Template7", new DateTime(2026, 7, 13, 0, 0, 0, 0, DateTimeKind.Utc), "Sepia line-engraved Roman garden with parallax scenes, a sideways-panning ceremony colonnade, and an expanding RSVP seating chart", true, true, "#3D3833", "#C9BFAE", 7, "roman-garden", "Roman Garden", "", "PRO" });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                columns: new[] { "CreatedDate", "PasswordHash" },
                values: new object[] { new DateTime(2026, 7, 13, 15, 1, 47, 745, DateTimeKind.Utc).AddTicks(9800), "$2a$11$bRzRU0a73auFvRZ2NlIB3eAvYswewr4D96kGrwDLkdxjrPRaUC1Va" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 7);

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 1,
                column: "CreatedDate",
                value: new DateTime(2026, 7, 7, 16, 38, 33, 384, DateTimeKind.Utc).AddTicks(8540));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 2,
                column: "CreatedDate",
                value: new DateTime(2026, 7, 7, 16, 38, 33, 384, DateTimeKind.Utc).AddTicks(8640));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 3,
                column: "CreatedDate",
                value: new DateTime(2026, 7, 7, 16, 38, 33, 384, DateTimeKind.Utc).AddTicks(8640));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 4,
                column: "CreatedDate",
                value: new DateTime(2026, 7, 7, 16, 38, 33, 384, DateTimeKind.Utc).AddTicks(8640));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 5,
                column: "CreatedDate",
                value: new DateTime(2026, 7, 7, 16, 38, 33, 384, DateTimeKind.Utc).AddTicks(8640));

            migrationBuilder.UpdateData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 1,
                column: "CreatedDate",
                value: new DateTime(2026, 7, 7, 16, 38, 33, 387, DateTimeKind.Utc).AddTicks(3420));

            migrationBuilder.UpdateData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 2,
                column: "CreatedDate",
                value: new DateTime(2026, 7, 7, 16, 38, 33, 387, DateTimeKind.Utc).AddTicks(3510));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                columns: new[] { "CreatedDate", "PasswordHash" },
                values: new object[] { new DateTime(2026, 7, 7, 16, 38, 33, 550, DateTimeKind.Utc).AddTicks(2490), "$2a$11$PJAvKffUQTEVscV8OjkLxeObdyXsD9ASPEbIY2dddfCK161vy//wG" });
        }
    }
}
