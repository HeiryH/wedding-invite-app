using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WeddingInvite.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddTemplate5DreamingFloralSky : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 1,
                column: "CreatedDate",
                value: new DateTime(2026, 4, 17, 23, 45, 43, 611, DateTimeKind.Utc).AddTicks(5060));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 2,
                column: "CreatedDate",
                value: new DateTime(2026, 4, 17, 23, 45, 43, 611, DateTimeKind.Utc).AddTicks(5150));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 3,
                column: "CreatedDate",
                value: new DateTime(2026, 4, 17, 23, 45, 43, 611, DateTimeKind.Utc).AddTicks(5150));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 4,
                column: "CreatedDate",
                value: new DateTime(2026, 4, 17, 23, 45, 43, 611, DateTimeKind.Utc).AddTicks(5150));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 5,
                column: "CreatedDate",
                value: new DateTime(2026, 4, 17, 23, 45, 43, 611, DateTimeKind.Utc).AddTicks(5160));

            migrationBuilder.UpdateData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 1,
                column: "CreatedDate",
                value: new DateTime(2026, 4, 17, 23, 45, 43, 614, DateTimeKind.Utc).AddTicks(6320));

            migrationBuilder.UpdateData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 2,
                column: "CreatedDate",
                value: new DateTime(2026, 4, 17, 23, 45, 43, 614, DateTimeKind.Utc).AddTicks(6420));

            migrationBuilder.InsertData(
                table: "Templates",
                columns: new[] { "TemplateId", "ComponentPath", "CreatedDate", "Description", "IsActive", "IsPremium", "PrimaryColor", "SecondaryColor", "SortOrder", "TemplateCode", "TemplateName", "ThumbnailUrl" },
                values: new object[] { 5, "Template5", new DateTime(2026, 4, 18, 0, 0, 0, 0, DateTimeKind.Utc), "Dreamy pastel floral sky with scroll-animated envelope reveal and immersive full-screen sections", true, true, "#C2896B", "#A8C4D4", 5, "dreaming-floral-sky", "Dreaming Floral Sky", "" });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                columns: new[] { "CreatedDate", "PasswordHash" },
                values: new object[] { new DateTime(2026, 4, 17, 23, 45, 43, 774, DateTimeKind.Utc).AddTicks(6680), "$2a$11$08VGDBs79qcXoOvR.cZpy.Iwu7ZCYgpyy.vmrXtAdAyQ6VHjB7aJW" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
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

            migrationBuilder.DeleteData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 5);

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                columns: new[] { "CreatedDate", "PasswordHash" },
                values: new object[] { new DateTime(2026, 3, 27, 14, 50, 19, 224, DateTimeKind.Utc).AddTicks(5940), "$2a$11$JQmj3u18BXjzCzaM/tyz8.8SjB6v6DTHIEUWGuxnvNPcV2BZ..4Ei" });
        }
    }
}
