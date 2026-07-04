using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WeddingInvite.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddWeddingIsPublic : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsPublic",
                table: "Weddings",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            // Backfill: all existing weddings were created by admins and are public
            migrationBuilder.Sql("UPDATE Weddings SET IsPublic = 1;");

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 1,
                column: "CreatedDate",
                value: new DateTime(2026, 6, 19, 9, 25, 33, 415, DateTimeKind.Utc).AddTicks(1870));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 2,
                column: "CreatedDate",
                value: new DateTime(2026, 6, 19, 9, 25, 33, 415, DateTimeKind.Utc).AddTicks(1950));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 3,
                column: "CreatedDate",
                value: new DateTime(2026, 6, 19, 9, 25, 33, 415, DateTimeKind.Utc).AddTicks(1950));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 4,
                column: "CreatedDate",
                value: new DateTime(2026, 6, 19, 9, 25, 33, 415, DateTimeKind.Utc).AddTicks(1950));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 5,
                column: "CreatedDate",
                value: new DateTime(2026, 6, 19, 9, 25, 33, 415, DateTimeKind.Utc).AddTicks(1950));

            migrationBuilder.UpdateData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 1,
                column: "CreatedDate",
                value: new DateTime(2026, 6, 19, 9, 25, 33, 417, DateTimeKind.Utc).AddTicks(5860));

            migrationBuilder.UpdateData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 2,
                column: "CreatedDate",
                value: new DateTime(2026, 6, 19, 9, 25, 33, 417, DateTimeKind.Utc).AddTicks(5940));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                columns: new[] { "CreatedDate", "PasswordHash" },
                values: new object[] { new DateTime(2026, 6, 19, 9, 25, 33, 582, DateTimeKind.Utc).AddTicks(4480), "$2a$11$cwZ7eny9.y3JYzCE6oNSOO8eJNxt7icp7pSJa5pKuUoYB1wY0Sxuu" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsPublic",
                table: "Weddings");

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 1,
                column: "CreatedDate",
                value: new DateTime(2026, 6, 19, 6, 2, 31, 194, DateTimeKind.Utc).AddTicks(310));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 2,
                column: "CreatedDate",
                value: new DateTime(2026, 6, 19, 6, 2, 31, 194, DateTimeKind.Utc).AddTicks(400));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 3,
                column: "CreatedDate",
                value: new DateTime(2026, 6, 19, 6, 2, 31, 194, DateTimeKind.Utc).AddTicks(400));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 4,
                column: "CreatedDate",
                value: new DateTime(2026, 6, 19, 6, 2, 31, 194, DateTimeKind.Utc).AddTicks(400));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 5,
                column: "CreatedDate",
                value: new DateTime(2026, 6, 19, 6, 2, 31, 194, DateTimeKind.Utc).AddTicks(400));

            migrationBuilder.UpdateData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 1,
                column: "CreatedDate",
                value: new DateTime(2026, 6, 19, 6, 2, 31, 196, DateTimeKind.Utc).AddTicks(3890));

            migrationBuilder.UpdateData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 2,
                column: "CreatedDate",
                value: new DateTime(2026, 6, 19, 6, 2, 31, 196, DateTimeKind.Utc).AddTicks(3970));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                columns: new[] { "CreatedDate", "PasswordHash" },
                values: new object[] { new DateTime(2026, 6, 19, 6, 2, 31, 360, DateTimeKind.Utc).AddTicks(8320), "$2a$11$UsfixjyZ3ZnD4gKQYWIVieJcWSO4676cjB8WQo/vjCBGB8X95WZuW" });
        }
    }
}
