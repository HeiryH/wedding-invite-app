using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WeddingInvite.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddTemplateEventTypes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "EventTypes",
                table: "Templates",
                type: "TEXT",
                maxLength: 100,
                nullable: false,
                defaultValue: "WEDDING");

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 1,
                column: "CreatedDate",
                value: new DateTime(2026, 7, 29, 12, 42, 19, 864, DateTimeKind.Utc).AddTicks(5070));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 2,
                column: "CreatedDate",
                value: new DateTime(2026, 7, 29, 12, 42, 19, 864, DateTimeKind.Utc).AddTicks(5170));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 3,
                column: "CreatedDate",
                value: new DateTime(2026, 7, 29, 12, 42, 19, 864, DateTimeKind.Utc).AddTicks(5170));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 4,
                column: "CreatedDate",
                value: new DateTime(2026, 7, 29, 12, 42, 19, 864, DateTimeKind.Utc).AddTicks(5170));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 5,
                column: "CreatedDate",
                value: new DateTime(2026, 7, 29, 12, 42, 19, 864, DateTimeKind.Utc).AddTicks(5170));

            migrationBuilder.UpdateData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 1,
                columns: new[] { "CreatedDate", "EventTypes" },
                values: new object[] { new DateTime(2026, 7, 29, 12, 42, 19, 867, DateTimeKind.Utc).AddTicks(1410), "WEDDING" });

            migrationBuilder.UpdateData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 2,
                columns: new[] { "CreatedDate", "EventTypes" },
                values: new object[] { new DateTime(2026, 7, 29, 12, 42, 19, 867, DateTimeKind.Utc).AddTicks(1500), "WEDDING" });

            migrationBuilder.UpdateData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 3,
                column: "EventTypes",
                value: "WEDDING");

            migrationBuilder.UpdateData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 4,
                column: "EventTypes",
                value: "WEDDING");

            migrationBuilder.UpdateData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 6,
                column: "EventTypes",
                value: "WEDDING");

            migrationBuilder.UpdateData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 7,
                column: "EventTypes",
                value: "WEDDING");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                columns: new[] { "CreatedDate", "PasswordHash" },
                values: new object[] { new DateTime(2026, 7, 29, 12, 42, 20, 20, DateTimeKind.Utc).AddTicks(2320), "$2a$11$WjLfYr1p1cDTSwq5cITX.eS67QrD9Mt26zFe.uPGgw8AEZ1gMHtkq" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EventTypes",
                table: "Templates");

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 1,
                column: "CreatedDate",
                value: new DateTime(2026, 7, 26, 12, 30, 38, 337, DateTimeKind.Utc).AddTicks(370));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 2,
                column: "CreatedDate",
                value: new DateTime(2026, 7, 26, 12, 30, 38, 337, DateTimeKind.Utc).AddTicks(460));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 3,
                column: "CreatedDate",
                value: new DateTime(2026, 7, 26, 12, 30, 38, 337, DateTimeKind.Utc).AddTicks(460));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 4,
                column: "CreatedDate",
                value: new DateTime(2026, 7, 26, 12, 30, 38, 337, DateTimeKind.Utc).AddTicks(460));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 5,
                column: "CreatedDate",
                value: new DateTime(2026, 7, 26, 12, 30, 38, 337, DateTimeKind.Utc).AddTicks(460));

            migrationBuilder.UpdateData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 1,
                column: "CreatedDate",
                value: new DateTime(2026, 7, 26, 12, 30, 38, 339, DateTimeKind.Utc).AddTicks(2690));

            migrationBuilder.UpdateData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 2,
                column: "CreatedDate",
                value: new DateTime(2026, 7, 26, 12, 30, 38, 339, DateTimeKind.Utc).AddTicks(2770));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                columns: new[] { "CreatedDate", "PasswordHash" },
                values: new object[] { new DateTime(2026, 7, 26, 12, 30, 38, 499, DateTimeKind.Utc).AddTicks(4560), "$2a$11$ka.SdbQyX9vw60gxNZ9UPeSYg7iq0OimDU4Ue2jZFbAzTWfI8xHie" });
        }
    }
}
