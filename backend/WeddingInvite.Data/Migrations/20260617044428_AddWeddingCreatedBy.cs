using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WeddingInvite.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddWeddingCreatedBy : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CreatedByUserId",
                table: "Weddings",
                type: "INTEGER",
                nullable: true);

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

            migrationBuilder.CreateIndex(
                name: "IX_Weddings_CreatedByUserId",
                table: "Weddings",
                column: "CreatedByUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Weddings_Users_CreatedByUserId",
                table: "Weddings",
                column: "CreatedByUserId",
                principalTable: "Users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Weddings_Users_CreatedByUserId",
                table: "Weddings");

            migrationBuilder.DropIndex(
                name: "IX_Weddings_CreatedByUserId",
                table: "Weddings");

            migrationBuilder.DropColumn(
                name: "CreatedByUserId",
                table: "Weddings");

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
    }
}
