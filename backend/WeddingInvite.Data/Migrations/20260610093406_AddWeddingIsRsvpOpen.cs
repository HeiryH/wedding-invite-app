using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WeddingInvite.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddWeddingIsRsvpOpen : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsRsvpOpen",
                table: "Weddings",
                type: "INTEGER",
                nullable: false,
                defaultValue: true);

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 1,
                column: "CreatedDate",
                value: new DateTime(2026, 6, 10, 9, 34, 6, 427, DateTimeKind.Utc).AddTicks(9460));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 2,
                column: "CreatedDate",
                value: new DateTime(2026, 6, 10, 9, 34, 6, 427, DateTimeKind.Utc).AddTicks(9580));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 3,
                column: "CreatedDate",
                value: new DateTime(2026, 6, 10, 9, 34, 6, 427, DateTimeKind.Utc).AddTicks(9580));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 4,
                column: "CreatedDate",
                value: new DateTime(2026, 6, 10, 9, 34, 6, 427, DateTimeKind.Utc).AddTicks(9580));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 5,
                column: "CreatedDate",
                value: new DateTime(2026, 6, 10, 9, 34, 6, 427, DateTimeKind.Utc).AddTicks(9580));

            migrationBuilder.UpdateData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 1,
                column: "CreatedDate",
                value: new DateTime(2026, 6, 10, 9, 34, 6, 430, DateTimeKind.Utc).AddTicks(8370));

            migrationBuilder.UpdateData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 2,
                column: "CreatedDate",
                value: new DateTime(2026, 6, 10, 9, 34, 6, 430, DateTimeKind.Utc).AddTicks(8470));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                columns: new[] { "CreatedDate", "PasswordHash" },
                values: new object[] { new DateTime(2026, 6, 10, 9, 34, 6, 591, DateTimeKind.Utc).AddTicks(3630), "$2a$11$tMGkSQFx8SzK8piQYvpIneHDBdhxIm.PQUioMr94RbhND0OohtpPS" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsRsvpOpen",
                table: "Weddings");

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
    }
}
