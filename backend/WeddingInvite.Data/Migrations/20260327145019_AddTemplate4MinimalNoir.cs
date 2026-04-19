using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WeddingInvite.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddTemplate4MinimalNoir : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 1,
                column: "CreatedDate",
                value: new DateTime(2026, 3, 27, 14, 50, 19, 30, DateTimeKind.Utc).AddTicks(8380));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 2,
                column: "CreatedDate",
                value: new DateTime(2026, 3, 27, 14, 50, 19, 30, DateTimeKind.Utc).AddTicks(8460));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 3,
                column: "CreatedDate",
                value: new DateTime(2026, 3, 27, 14, 50, 19, 30, DateTimeKind.Utc).AddTicks(8470));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 4,
                column: "CreatedDate",
                value: new DateTime(2026, 3, 27, 14, 50, 19, 30, DateTimeKind.Utc).AddTicks(8470));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 5,
                column: "CreatedDate",
                value: new DateTime(2026, 3, 27, 14, 50, 19, 30, DateTimeKind.Utc).AddTicks(8470));

            migrationBuilder.UpdateData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 1,
                column: "CreatedDate",
                value: new DateTime(2026, 3, 27, 14, 50, 19, 34, DateTimeKind.Utc).AddTicks(330));

            migrationBuilder.UpdateData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 2,
                column: "CreatedDate",
                value: new DateTime(2026, 3, 27, 14, 50, 19, 34, DateTimeKind.Utc).AddTicks(420));

            migrationBuilder.InsertData(
                table: "Templates",
                columns: new[] { "TemplateId", "ComponentPath", "CreatedDate", "Description", "IsActive", "IsPremium", "PrimaryColor", "SecondaryColor", "SortOrder", "TemplateCode", "TemplateName", "ThumbnailUrl" },
                values: new object[] { 4, "Template4", new DateTime(2026, 3, 27, 0, 0, 0, 0, DateTimeKind.Utc), "Clean cream and black editorial design with torn-paper dividers, live countdown, and timeline schedule", true, true, "#1C1C1A", "#8A8A80", 4, "minimal-noir", "Minimal Noir", "" });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                columns: new[] { "CreatedDate", "PasswordHash" },
                values: new object[] { new DateTime(2026, 3, 27, 14, 50, 19, 224, DateTimeKind.Utc).AddTicks(5940), "$2a$11$JQmj3u18BXjzCzaM/tyz8.8SjB6v6DTHIEUWGuxnvNPcV2BZ..4Ei" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 4);

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 1,
                column: "CreatedDate",
                value: new DateTime(2026, 3, 25, 15, 36, 22, 846, DateTimeKind.Utc).AddTicks(80));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 2,
                column: "CreatedDate",
                value: new DateTime(2026, 3, 25, 15, 36, 22, 846, DateTimeKind.Utc).AddTicks(170));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 3,
                column: "CreatedDate",
                value: new DateTime(2026, 3, 25, 15, 36, 22, 846, DateTimeKind.Utc).AddTicks(170));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 4,
                column: "CreatedDate",
                value: new DateTime(2026, 3, 25, 15, 36, 22, 846, DateTimeKind.Utc).AddTicks(170));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 5,
                column: "CreatedDate",
                value: new DateTime(2026, 3, 25, 15, 36, 22, 846, DateTimeKind.Utc).AddTicks(170));

            migrationBuilder.UpdateData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 1,
                column: "CreatedDate",
                value: new DateTime(2026, 3, 25, 15, 36, 22, 849, DateTimeKind.Utc).AddTicks(260));

            migrationBuilder.UpdateData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 2,
                column: "CreatedDate",
                value: new DateTime(2026, 3, 25, 15, 36, 22, 849, DateTimeKind.Utc).AddTicks(370));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                columns: new[] { "CreatedDate", "PasswordHash" },
                values: new object[] { new DateTime(2026, 3, 25, 15, 36, 23, 19, DateTimeKind.Utc).AddTicks(1580), "$2a$11$bGJ3TdGLEz3txAGoD8VmOuex2KS4iyv6o.EW4cCxeYYcqmsXpQtKW" });
        }
    }
}
