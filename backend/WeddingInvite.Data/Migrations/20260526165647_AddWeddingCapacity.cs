using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WeddingInvite.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddWeddingCapacity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "MaxCapacity",
                table: "Weddings",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "ShowCapacityWarning",
                table: "Weddings",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 1,
                column: "CreatedDate",
                value: new DateTime(2026, 5, 26, 16, 56, 47, 47, DateTimeKind.Utc).AddTicks(8710));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 2,
                column: "CreatedDate",
                value: new DateTime(2026, 5, 26, 16, 56, 47, 47, DateTimeKind.Utc).AddTicks(8820));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 3,
                column: "CreatedDate",
                value: new DateTime(2026, 5, 26, 16, 56, 47, 47, DateTimeKind.Utc).AddTicks(8820));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 4,
                column: "CreatedDate",
                value: new DateTime(2026, 5, 26, 16, 56, 47, 47, DateTimeKind.Utc).AddTicks(8830));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 5,
                column: "CreatedDate",
                value: new DateTime(2026, 5, 26, 16, 56, 47, 47, DateTimeKind.Utc).AddTicks(8830));

            migrationBuilder.UpdateData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 1,
                column: "CreatedDate",
                value: new DateTime(2026, 5, 26, 16, 56, 47, 51, DateTimeKind.Utc).AddTicks(160));

            migrationBuilder.UpdateData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 2,
                column: "CreatedDate",
                value: new DateTime(2026, 5, 26, 16, 56, 47, 51, DateTimeKind.Utc).AddTicks(250));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                columns: new[] { "CreatedDate", "PasswordHash" },
                values: new object[] { new DateTime(2026, 5, 26, 16, 56, 47, 215, DateTimeKind.Utc).AddTicks(6980), "$2a$11$6WG.byNOVk.N.qZ4yZDFkuSa7SgklTZrJ/QC86.5htYqC/qxHdkgK" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MaxCapacity",
                table: "Weddings");

            migrationBuilder.DropColumn(
                name: "ShowCapacityWarning",
                table: "Weddings");

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 1,
                column: "CreatedDate",
                value: new DateTime(2026, 5, 25, 17, 31, 50, 199, DateTimeKind.Utc).AddTicks(7400));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 2,
                column: "CreatedDate",
                value: new DateTime(2026, 5, 25, 17, 31, 50, 199, DateTimeKind.Utc).AddTicks(7480));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 3,
                column: "CreatedDate",
                value: new DateTime(2026, 5, 25, 17, 31, 50, 199, DateTimeKind.Utc).AddTicks(7480));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 4,
                column: "CreatedDate",
                value: new DateTime(2026, 5, 25, 17, 31, 50, 199, DateTimeKind.Utc).AddTicks(7480));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 5,
                column: "CreatedDate",
                value: new DateTime(2026, 5, 25, 17, 31, 50, 199, DateTimeKind.Utc).AddTicks(7490));

            migrationBuilder.UpdateData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 1,
                column: "CreatedDate",
                value: new DateTime(2026, 5, 25, 17, 31, 50, 202, DateTimeKind.Utc).AddTicks(6010));

            migrationBuilder.UpdateData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 2,
                column: "CreatedDate",
                value: new DateTime(2026, 5, 25, 17, 31, 50, 202, DateTimeKind.Utc).AddTicks(6110));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                columns: new[] { "CreatedDate", "PasswordHash" },
                values: new object[] { new DateTime(2026, 5, 25, 17, 31, 50, 387, DateTimeKind.Utc).AddTicks(2230), "$2a$11$1R0QUV1zv0dTpBkLoVRCzuuCiNToZIyIqcRTsyeb3gyLcj/5bD/z." });
        }
    }
}
