using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WeddingInvite.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddUserIsActive : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "Users",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 1,
                column: "CreatedDate",
                value: new DateTime(2026, 2, 27, 12, 55, 57, 90, DateTimeKind.Utc).AddTicks(6610));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 2,
                column: "CreatedDate",
                value: new DateTime(2026, 2, 27, 12, 55, 57, 90, DateTimeKind.Utc).AddTicks(6690));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 3,
                column: "CreatedDate",
                value: new DateTime(2026, 2, 27, 12, 55, 57, 90, DateTimeKind.Utc).AddTicks(6690));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 4,
                column: "CreatedDate",
                value: new DateTime(2026, 2, 27, 12, 55, 57, 90, DateTimeKind.Utc).AddTicks(6690));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 5,
                column: "CreatedDate",
                value: new DateTime(2026, 2, 27, 12, 55, 57, 90, DateTimeKind.Utc).AddTicks(6700));

            migrationBuilder.UpdateData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 1,
                column: "CreatedDate",
                value: new DateTime(2026, 2, 27, 12, 55, 57, 93, DateTimeKind.Utc).AddTicks(7240));

            migrationBuilder.UpdateData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 2,
                column: "CreatedDate",
                value: new DateTime(2026, 2, 27, 12, 55, 57, 93, DateTimeKind.Utc).AddTicks(7330));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                columns: new[] { "CreatedDate", "IsActive", "PasswordHash" },
                values: new object[] { new DateTime(2026, 2, 27, 12, 55, 57, 255, DateTimeKind.Utc).AddTicks(8120), true, "$2a$11$rPKyUwPgfJiS4BekSHDCdua7/tSKgQ/pjUZEV8u0y2LR2wIDFHewq" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "Users");

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 1,
                column: "CreatedDate",
                value: new DateTime(2026, 2, 26, 8, 28, 39, 99, DateTimeKind.Utc).AddTicks(9830));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 2,
                column: "CreatedDate",
                value: new DateTime(2026, 2, 26, 8, 28, 39, 99, DateTimeKind.Utc).AddTicks(9920));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 3,
                column: "CreatedDate",
                value: new DateTime(2026, 2, 26, 8, 28, 39, 99, DateTimeKind.Utc).AddTicks(9920));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 4,
                column: "CreatedDate",
                value: new DateTime(2026, 2, 26, 8, 28, 39, 99, DateTimeKind.Utc).AddTicks(9920));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 5,
                column: "CreatedDate",
                value: new DateTime(2026, 2, 26, 8, 28, 39, 99, DateTimeKind.Utc).AddTicks(9920));

            migrationBuilder.UpdateData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 1,
                column: "CreatedDate",
                value: new DateTime(2026, 2, 26, 8, 28, 39, 102, DateTimeKind.Utc).AddTicks(6560));

            migrationBuilder.UpdateData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 2,
                column: "CreatedDate",
                value: new DateTime(2026, 2, 26, 8, 28, 39, 102, DateTimeKind.Utc).AddTicks(6640));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                columns: new[] { "CreatedDate", "PasswordHash" },
                values: new object[] { new DateTime(2026, 2, 26, 8, 28, 39, 272, DateTimeKind.Utc).AddTicks(640), "$2a$11$gm2difYpQOYBa/O6BJf.9.d0LUZvgML1alF9cyoz6yKlnj3e7Eu9C" });
        }
    }
}
