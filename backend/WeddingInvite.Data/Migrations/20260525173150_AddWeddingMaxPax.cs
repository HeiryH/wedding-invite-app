using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WeddingInvite.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddWeddingMaxPax : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "MaxPax",
                table: "Weddings",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

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

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MaxPax",
                table: "Weddings");

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

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                columns: new[] { "CreatedDate", "PasswordHash" },
                values: new object[] { new DateTime(2026, 5, 19, 14, 50, 26, 760, DateTimeKind.Utc).AddTicks(1740), "$2a$11$Qc.S3SnscXMyXeaO0Ekw7.i5s7uSs23hrgC3m2lfOQHrp086S7jm6" });
        }
    }
}
