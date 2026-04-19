using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WeddingInvite.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddPhotoModeration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Caption",
                table: "Photos",
                type: "TEXT",
                maxLength: 500,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "TEXT",
                oldMaxLength: 500);

            migrationBuilder.AddColumn<int>(
                name: "ApprovedByUserId",
                table: "Photos",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ApprovedDate",
                table: "Photos",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsFeatured",
                table: "Photos",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "PhotoUrl",
                table: "Photos",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "RejectionReason",
                table: "Photos",
                type: "TEXT",
                maxLength: 500,
                nullable: true);

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 1,
                column: "CreatedDate",
                value: new DateTime(2026, 1, 28, 5, 35, 35, 214, DateTimeKind.Utc).AddTicks(9620));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 2,
                column: "CreatedDate",
                value: new DateTime(2026, 1, 28, 5, 35, 35, 214, DateTimeKind.Utc).AddTicks(9710));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 3,
                column: "CreatedDate",
                value: new DateTime(2026, 1, 28, 5, 35, 35, 214, DateTimeKind.Utc).AddTicks(9710));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 4,
                column: "CreatedDate",
                value: new DateTime(2026, 1, 28, 5, 35, 35, 214, DateTimeKind.Utc).AddTicks(9710));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 5,
                column: "CreatedDate",
                value: new DateTime(2026, 1, 28, 5, 35, 35, 214, DateTimeKind.Utc).AddTicks(9710));

            migrationBuilder.UpdateData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 1,
                column: "CreatedDate",
                value: new DateTime(2026, 1, 28, 5, 35, 35, 216, DateTimeKind.Utc).AddTicks(3910));

            migrationBuilder.UpdateData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 2,
                column: "CreatedDate",
                value: new DateTime(2026, 1, 28, 5, 35, 35, 216, DateTimeKind.Utc).AddTicks(4000));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                columns: new[] { "CreatedDate", "PasswordHash" },
                values: new object[] { new DateTime(2026, 1, 28, 5, 35, 35, 392, DateTimeKind.Utc).AddTicks(1370), "$2a$11$TdM5.73WbIBe43adHzNkGOLlk6tvrbvVUjMCmKjMv/bGrSFbmqs9i" });

            migrationBuilder.CreateIndex(
                name: "IX_Photos_ApprovedByUserId",
                table: "Photos",
                column: "ApprovedByUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Photos_Users_ApprovedByUserId",
                table: "Photos",
                column: "ApprovedByUserId",
                principalTable: "Users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Photos_Users_ApprovedByUserId",
                table: "Photos");

            migrationBuilder.DropIndex(
                name: "IX_Photos_ApprovedByUserId",
                table: "Photos");

            migrationBuilder.DropColumn(
                name: "ApprovedByUserId",
                table: "Photos");

            migrationBuilder.DropColumn(
                name: "ApprovedDate",
                table: "Photos");

            migrationBuilder.DropColumn(
                name: "IsFeatured",
                table: "Photos");

            migrationBuilder.DropColumn(
                name: "PhotoUrl",
                table: "Photos");

            migrationBuilder.DropColumn(
                name: "RejectionReason",
                table: "Photos");

            migrationBuilder.AlterColumn<string>(
                name: "Caption",
                table: "Photos",
                type: "TEXT",
                maxLength: 500,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "TEXT",
                oldMaxLength: 500,
                oldNullable: true);

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 1,
                column: "CreatedDate",
                value: new DateTime(2026, 1, 28, 5, 10, 28, 2, DateTimeKind.Utc).AddTicks(9610));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 2,
                column: "CreatedDate",
                value: new DateTime(2026, 1, 28, 5, 10, 28, 2, DateTimeKind.Utc).AddTicks(9690));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 3,
                column: "CreatedDate",
                value: new DateTime(2026, 1, 28, 5, 10, 28, 2, DateTimeKind.Utc).AddTicks(9690));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 4,
                column: "CreatedDate",
                value: new DateTime(2026, 1, 28, 5, 10, 28, 2, DateTimeKind.Utc).AddTicks(9690));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 5,
                column: "CreatedDate",
                value: new DateTime(2026, 1, 28, 5, 10, 28, 2, DateTimeKind.Utc).AddTicks(9690));

            migrationBuilder.UpdateData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 1,
                column: "CreatedDate",
                value: new DateTime(2026, 1, 28, 5, 10, 28, 3, DateTimeKind.Utc).AddTicks(9080));

            migrationBuilder.UpdateData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 2,
                column: "CreatedDate",
                value: new DateTime(2026, 1, 28, 5, 10, 28, 3, DateTimeKind.Utc).AddTicks(9160));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                columns: new[] { "CreatedDate", "PasswordHash" },
                values: new object[] { new DateTime(2026, 1, 28, 5, 10, 28, 163, DateTimeKind.Utc).AddTicks(9250), "$2a$11$Oecz3llmI4qkDk4J7xaJXueXLtPIlRUpj7OPreN/YkDdvAP55SAby" });
        }
    }
}
