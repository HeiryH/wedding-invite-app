using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WeddingInvite.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddTemplateTier : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Tier",
                table: "Templates",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

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
                columns: new[] { "CreatedDate", "Tier" },
                values: new object[] { new DateTime(2026, 6, 17, 13, 45, 34, 316, DateTimeKind.Utc).AddTicks(6840), "FREE" });

            migrationBuilder.UpdateData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 2,
                columns: new[] { "CreatedDate", "Tier" },
                values: new object[] { new DateTime(2026, 6, 17, 13, 45, 34, 316, DateTimeKind.Utc).AddTicks(6930), "PREMIUM" });

            migrationBuilder.UpdateData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 3,
                column: "Tier",
                value: "PREMIUM");

            migrationBuilder.UpdateData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 4,
                column: "Tier",
                value: "PREMIUM");

            migrationBuilder.UpdateData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 6,
                column: "Tier",
                value: "PREMIUM");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                columns: new[] { "CreatedDate", "PasswordHash" },
                values: new object[] { new DateTime(2026, 6, 17, 13, 45, 34, 473, DateTimeKind.Utc).AddTicks(9770), "$2a$11$dQEQ3lwRYoOM5BiTIRnGLOdEFuB0RhE8P/l5u6ytKM0XD80iGrjF6" });

            // Backfill Tier for any rows not covered by the seed UpdateData above
            // (e.g. templates inserted by earlier migrations, such as Template 5).
            migrationBuilder.Sql("UPDATE Templates SET Tier = 'PREMIUM' WHERE IsPremium = 1 AND (Tier IS NULL OR Tier = '');");
            migrationBuilder.Sql("UPDATE Templates SET Tier = 'FREE' WHERE Tier IS NULL OR Tier = '';");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Tier",
                table: "Templates");

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 1,
                column: "CreatedDate",
                value: new DateTime(2026, 6, 17, 4, 44, 28, 136, DateTimeKind.Utc).AddTicks(640));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 2,
                column: "CreatedDate",
                value: new DateTime(2026, 6, 17, 4, 44, 28, 136, DateTimeKind.Utc).AddTicks(740));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 3,
                column: "CreatedDate",
                value: new DateTime(2026, 6, 17, 4, 44, 28, 136, DateTimeKind.Utc).AddTicks(740));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 4,
                column: "CreatedDate",
                value: new DateTime(2026, 6, 17, 4, 44, 28, 136, DateTimeKind.Utc).AddTicks(740));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 5,
                column: "CreatedDate",
                value: new DateTime(2026, 6, 17, 4, 44, 28, 136, DateTimeKind.Utc).AddTicks(740));

            migrationBuilder.UpdateData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 1,
                column: "CreatedDate",
                value: new DateTime(2026, 6, 17, 4, 44, 28, 138, DateTimeKind.Utc).AddTicks(9180));

            migrationBuilder.UpdateData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 2,
                column: "CreatedDate",
                value: new DateTime(2026, 6, 17, 4, 44, 28, 138, DateTimeKind.Utc).AddTicks(9270));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                columns: new[] { "CreatedDate", "PasswordHash" },
                values: new object[] { new DateTime(2026, 6, 17, 4, 44, 28, 288, DateTimeKind.Utc).AddTicks(4070), "$2a$11$.KCLZXNkA6XectiBJeDoqeBcScfTZPJyNQvGqWG49kpg0iwTg/jvm" });
        }
    }
}
