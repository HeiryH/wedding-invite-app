using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WeddingInvite.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddTemplate10SunnySafari : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 1,
                column: "CreatedDate",
                value: new DateTime(2026, 9, 6, 13, 34, 46, 594, DateTimeKind.Utc).AddTicks(3290));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 2,
                column: "CreatedDate",
                value: new DateTime(2026, 9, 6, 13, 34, 46, 594, DateTimeKind.Utc).AddTicks(3380));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 3,
                column: "CreatedDate",
                value: new DateTime(2026, 9, 6, 13, 34, 46, 594, DateTimeKind.Utc).AddTicks(3380));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 4,
                column: "CreatedDate",
                value: new DateTime(2026, 9, 6, 13, 34, 46, 594, DateTimeKind.Utc).AddTicks(3380));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 5,
                column: "CreatedDate",
                value: new DateTime(2026, 9, 6, 13, 34, 46, 594, DateTimeKind.Utc).AddTicks(3380));

            migrationBuilder.UpdateData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 1,
                column: "CreatedDate",
                value: new DateTime(2026, 9, 6, 13, 34, 46, 595, DateTimeKind.Utc).AddTicks(6320));

            migrationBuilder.UpdateData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 2,
                column: "CreatedDate",
                value: new DateTime(2026, 9, 6, 13, 34, 46, 595, DateTimeKind.Utc).AddTicks(6420));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                columns: new[] { "CreatedDate", "PasswordHash" },
                values: new object[] { new DateTime(2026, 9, 6, 13, 34, 46, 764, DateTimeKind.Utc).AddTicks(4500), "$2a$11$EEWcUchDKrqwWy.ACR2Mo./gMNBfvLCvgDxB3wh8.7OQiDIzPQliW" });

            // PARTY, full-screen stage compositor (same engine as Template 7), PRO tier — see
            // Template10-sunnysafari/. Raw InsertData rather than AppDbContext HasData, matching
            // Templates 5/8/9: keeps the model snapshot untouched.
            migrationBuilder.InsertData(
                table: "Templates",
                columns: new[] { "TemplateId", "ComponentPath", "CreatedDate", "Description", "EventTypes", "IsActive", "IsPremium", "PrimaryColor", "SecondaryColor", "SortOrder", "TemplateCode", "TemplateName", "ThumbnailUrl", "Tier" },
                values: new object[] { 10, "Template10", new DateTime(2026, 9, 6, 0, 0, 0, 0, DateTimeKind.Utc), "Hand-illustrated crayon-texture safari scene for milestone birthdays — full stage/layer compositor with the PRO Adjust editor, one honoree plus a companion name in the hero", "PARTY", true, true, "#E9542E", "#F2C230", 10, "sunny-safari", "Sunny Safari", "", "PRO" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 10);

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 1,
                column: "CreatedDate",
                value: new DateTime(2026, 8, 22, 17, 32, 13, 467, DateTimeKind.Utc).AddTicks(7500));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 2,
                column: "CreatedDate",
                value: new DateTime(2026, 8, 22, 17, 32, 13, 467, DateTimeKind.Utc).AddTicks(7600));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 3,
                column: "CreatedDate",
                value: new DateTime(2026, 8, 22, 17, 32, 13, 467, DateTimeKind.Utc).AddTicks(7600));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 4,
                column: "CreatedDate",
                value: new DateTime(2026, 8, 22, 17, 32, 13, 467, DateTimeKind.Utc).AddTicks(7600));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 5,
                column: "CreatedDate",
                value: new DateTime(2026, 8, 22, 17, 32, 13, 467, DateTimeKind.Utc).AddTicks(7610));

            migrationBuilder.UpdateData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 1,
                column: "CreatedDate",
                value: new DateTime(2026, 8, 22, 17, 32, 13, 470, DateTimeKind.Utc).AddTicks(100));

            migrationBuilder.UpdateData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 2,
                column: "CreatedDate",
                value: new DateTime(2026, 8, 22, 17, 32, 13, 470, DateTimeKind.Utc).AddTicks(200));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                columns: new[] { "CreatedDate", "PasswordHash" },
                values: new object[] { new DateTime(2026, 8, 22, 17, 32, 13, 660, DateTimeKind.Utc).AddTicks(3550), "$2a$11$OVSCQWgxLfsMrkB8aIXSu.pSu8nUu1oMFXVsMKfD0gOsZFrqCTlQu" });
        }
    }
}
