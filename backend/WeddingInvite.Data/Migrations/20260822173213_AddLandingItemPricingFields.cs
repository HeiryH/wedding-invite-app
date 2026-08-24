using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WeddingInvite.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddLandingItemPricingFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Cta",
                table: "LandingItems",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CtaHref",
                table: "LandingItems",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Features",
                table: "LandingItems",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "Highlighted",
                table: "LandingItems",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "Price",
                table: "LandingItems",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

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

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Cta",
                table: "LandingItems");

            migrationBuilder.DropColumn(
                name: "CtaHref",
                table: "LandingItems");

            migrationBuilder.DropColumn(
                name: "Features",
                table: "LandingItems");

            migrationBuilder.DropColumn(
                name: "Highlighted",
                table: "LandingItems");

            migrationBuilder.DropColumn(
                name: "Price",
                table: "LandingItems");

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

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                columns: new[] { "CreatedDate", "PasswordHash" },
                values: new object[] { new DateTime(2026, 8, 3, 4, 58, 36, 174, DateTimeKind.Utc).AddTicks(9410), "$2a$11$ZgBCh/O7ZGiQViAJYIj61.yVIOsezjP4n4u3HJxM8SmGRJnxeOfD6" });
        }
    }
}
