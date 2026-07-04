using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WeddingInvite.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddUserTier : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Tier",
                table: "Users",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

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
                columns: new[] { "CreatedDate", "PasswordHash", "Tier" },
                values: new object[] { new DateTime(2026, 6, 19, 6, 2, 31, 360, DateTimeKind.Utc).AddTicks(8320), "$2a$11$UsfixjyZ3ZnD4gKQYWIVieJcWSO4676cjB8WQo/vjCBGB8X95WZuW", "FREE" });

            // Backfill Tier for any existing users not covered by seed UpdateData above.
            migrationBuilder.Sql("UPDATE Users SET Tier = 'FREE' WHERE Tier IS NULL OR Tier = '';");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Tier",
                table: "Users");

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 1,
                column: "CreatedDate",
                value: new DateTime(2026, 6, 17, 13, 45, 34, 313, DateTimeKind.Utc).AddTicks(8810));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 2,
                column: "CreatedDate",
                value: new DateTime(2026, 6, 17, 13, 45, 34, 313, DateTimeKind.Utc).AddTicks(8900));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 3,
                column: "CreatedDate",
                value: new DateTime(2026, 6, 17, 13, 45, 34, 313, DateTimeKind.Utc).AddTicks(8900));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 4,
                column: "CreatedDate",
                value: new DateTime(2026, 6, 17, 13, 45, 34, 313, DateTimeKind.Utc).AddTicks(8900));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 5,
                column: "CreatedDate",
                value: new DateTime(2026, 6, 17, 13, 45, 34, 313, DateTimeKind.Utc).AddTicks(8900));

            migrationBuilder.UpdateData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 1,
                column: "CreatedDate",
                value: new DateTime(2026, 6, 17, 13, 45, 34, 316, DateTimeKind.Utc).AddTicks(6840));

            migrationBuilder.UpdateData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 2,
                column: "CreatedDate",
                value: new DateTime(2026, 6, 17, 13, 45, 34, 316, DateTimeKind.Utc).AddTicks(6930));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                columns: new[] { "CreatedDate", "PasswordHash" },
                values: new object[] { new DateTime(2026, 6, 17, 13, 45, 34, 473, DateTimeKind.Utc).AddTicks(9770), "$2a$11$dQEQ3lwRYoOM5BiTIRnGLOdEFuB0RhE8P/l5u6ytKM0XD80iGrjF6" });
        }
    }
}
