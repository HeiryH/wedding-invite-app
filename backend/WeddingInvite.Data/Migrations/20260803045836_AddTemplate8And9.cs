using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WeddingInvite.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddTemplate8And9 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 1,
                column: "CreatedDate",
                value: new DateTime(2026, 8, 3, 4, 58, 36, 6, DateTimeKind.Utc).AddTicks(3320));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 2,
                column: "CreatedDate",
                value: new DateTime(2026, 8, 3, 4, 58, 36, 6, DateTimeKind.Utc).AddTicks(3400));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 3,
                column: "CreatedDate",
                value: new DateTime(2026, 8, 3, 4, 58, 36, 6, DateTimeKind.Utc).AddTicks(3400));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 4,
                column: "CreatedDate",
                value: new DateTime(2026, 8, 3, 4, 58, 36, 6, DateTimeKind.Utc).AddTicks(3400));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 5,
                column: "CreatedDate",
                value: new DateTime(2026, 8, 3, 4, 58, 36, 6, DateTimeKind.Utc).AddTicks(3400));

            migrationBuilder.UpdateData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 1,
                column: "CreatedDate",
                value: new DateTime(2026, 8, 3, 4, 58, 36, 7, DateTimeKind.Utc).AddTicks(6640));

            migrationBuilder.UpdateData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 2,
                column: "CreatedDate",
                value: new DateTime(2026, 8, 3, 4, 58, 36, 7, DateTimeKind.Utc).AddTicks(6750));

            migrationBuilder.InsertData(
                table: "Templates",
                columns: new[] { "TemplateId", "ComponentPath", "CreatedDate", "Description", "EventTypes", "IsActive", "IsPremium", "PrimaryColor", "SecondaryColor", "SortOrder", "TemplateCode", "TemplateName", "ThumbnailUrl", "Tier" },
                values: new object[] { 8, "Template8", new DateTime(2026, 8, 3, 0, 0, 0, 0, DateTimeKind.Utc), "Scalloped gilded arch banquet backdrop for milestone birthdays — one honoree, festive SEA banquet-hall register", "PARTY", true, false, "#C1613D", "#C9A227", 8, "gilded-arch", "Gilded Arch", "", "FREE" });

            migrationBuilder.InsertData(
                table: "Templates",
                columns: new[] { "TemplateId", "ComponentPath", "CreatedDate", "Description", "EventTypes", "IsActive", "IsPremium", "PrimaryColor", "SecondaryColor", "SortOrder", "TemplateCode", "TemplateName", "ThumbnailUrl", "Tier" },
                values: new object[] { 9, "Template9", new DateTime(2026, 8, 3, 0, 0, 0, 0, DateTimeKind.Utc), "Formal engraved-certificate typography with a wax-seal emblem, for aqiqahs, naming days, and other name-free ceremonies", "CEREMONY", true, false, "#1C1B19", "#B08D3E", 9, "engraved-certificate", "Engraved Certificate", "", "FREE" });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                columns: new[] { "CreatedDate", "PasswordHash" },
                values: new object[] { new DateTime(2026, 8, 3, 4, 58, 36, 174, DateTimeKind.Utc).AddTicks(9410), "$2a$11$ZgBCh/O7ZGiQViAJYIj61.yVIOsezjP4n4u3HJxM8SmGRJnxeOfD6" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 8);

            migrationBuilder.DeleteData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 9);

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 1,
                column: "CreatedDate",
                value: new DateTime(2026, 8, 2, 7, 32, 35, 256, DateTimeKind.Utc).AddTicks(7320));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 2,
                column: "CreatedDate",
                value: new DateTime(2026, 8, 2, 7, 32, 35, 256, DateTimeKind.Utc).AddTicks(7410));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 3,
                column: "CreatedDate",
                value: new DateTime(2026, 8, 2, 7, 32, 35, 256, DateTimeKind.Utc).AddTicks(7410));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 4,
                column: "CreatedDate",
                value: new DateTime(2026, 8, 2, 7, 32, 35, 256, DateTimeKind.Utc).AddTicks(7410));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 5,
                column: "CreatedDate",
                value: new DateTime(2026, 8, 2, 7, 32, 35, 256, DateTimeKind.Utc).AddTicks(7410));

            migrationBuilder.UpdateData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 1,
                column: "CreatedDate",
                value: new DateTime(2026, 8, 2, 7, 32, 35, 258, DateTimeKind.Utc).AddTicks(1520));

            migrationBuilder.UpdateData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 2,
                column: "CreatedDate",
                value: new DateTime(2026, 8, 2, 7, 32, 35, 258, DateTimeKind.Utc).AddTicks(1600));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                columns: new[] { "CreatedDate", "PasswordHash" },
                values: new object[] { new DateTime(2026, 8, 2, 7, 32, 35, 422, DateTimeKind.Utc).AddTicks(6930), "$2a$11$YLXj5ur4T9zQjNYoCInpA.M0AZgVv9d.9JuQA3ShmkNZozmwjYjbq" });
        }
    }
}
