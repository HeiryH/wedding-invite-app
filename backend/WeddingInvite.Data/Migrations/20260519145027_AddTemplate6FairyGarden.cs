using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WeddingInvite.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddTemplate6FairyGarden : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 1,
                column: "CreatedDate",
                value: new DateTime(2026, 5, 19, 14, 50, 26, 589, DateTimeKind.Utc).AddTicks(4340));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 2,
                column: "CreatedDate",
                value: new DateTime(2026, 5, 19, 14, 50, 26, 589, DateTimeKind.Utc).AddTicks(4440));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 3,
                column: "CreatedDate",
                value: new DateTime(2026, 5, 19, 14, 50, 26, 589, DateTimeKind.Utc).AddTicks(4440));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 4,
                column: "CreatedDate",
                value: new DateTime(2026, 5, 19, 14, 50, 26, 589, DateTimeKind.Utc).AddTicks(4440));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 5,
                column: "CreatedDate",
                value: new DateTime(2026, 5, 19, 14, 50, 26, 589, DateTimeKind.Utc).AddTicks(4440));

            migrationBuilder.UpdateData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 1,
                column: "CreatedDate",
                value: new DateTime(2026, 5, 19, 14, 50, 26, 595, DateTimeKind.Utc).AddTicks(440));

            migrationBuilder.UpdateData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 2,
                column: "CreatedDate",
                value: new DateTime(2026, 5, 19, 14, 50, 26, 595, DateTimeKind.Utc).AddTicks(530));

            migrationBuilder.InsertData(
                table: "Templates",
                columns: new[] { "TemplateId", "ComponentPath", "CreatedDate", "Description", "IsActive", "IsPremium", "PrimaryColor", "SecondaryColor", "SortOrder", "TemplateCode", "TemplateName", "ThumbnailUrl" },
                values: new object[] { 6, "Template6", new DateTime(2026, 5, 19, 0, 0, 0, 0, DateTimeKind.Utc), "Enchanted fairy garden with glowing 3D fireflies, falling petals, and immersive forest scenes", true, true, "#f7c6d7", "#a8d5a2", 6, "fairy-garden", "Fairy Garden", "" });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                columns: new[] { "CreatedDate", "PasswordHash" },
                values: new object[] { new DateTime(2026, 5, 19, 14, 50, 26, 760, DateTimeKind.Utc).AddTicks(1740), "$2a$11$Qc.S3SnscXMyXeaO0Ekw7.i5s7uSs23hrgC3m2lfOQHrp086S7jm6" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 6);

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 1,
                column: "CreatedDate",
                value: new DateTime(2026, 4, 29, 11, 19, 16, 165, DateTimeKind.Utc).AddTicks(8750));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 2,
                column: "CreatedDate",
                value: new DateTime(2026, 4, 29, 11, 19, 16, 165, DateTimeKind.Utc).AddTicks(8830));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 3,
                column: "CreatedDate",
                value: new DateTime(2026, 4, 29, 11, 19, 16, 165, DateTimeKind.Utc).AddTicks(8830));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 4,
                column: "CreatedDate",
                value: new DateTime(2026, 4, 29, 11, 19, 16, 165, DateTimeKind.Utc).AddTicks(8830));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 5,
                column: "CreatedDate",
                value: new DateTime(2026, 4, 29, 11, 19, 16, 165, DateTimeKind.Utc).AddTicks(8830));

            migrationBuilder.UpdateData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 1,
                column: "CreatedDate",
                value: new DateTime(2026, 4, 29, 11, 19, 16, 168, DateTimeKind.Utc).AddTicks(6790));

            migrationBuilder.UpdateData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 2,
                column: "CreatedDate",
                value: new DateTime(2026, 4, 29, 11, 19, 16, 168, DateTimeKind.Utc).AddTicks(6880));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                columns: new[] { "CreatedDate", "PasswordHash" },
                values: new object[] { new DateTime(2026, 4, 29, 11, 19, 16, 340, DateTimeKind.Utc).AddTicks(1450), "$2a$11$y.Zt3NzFk0vyJE5V1rb75uDOhIt9sRBnK0YFnUC9h0.swdyf7ZAi6" });
        }
    }
}
