using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WeddingInvite.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddUsers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    UserId = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Email = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    PasswordHash = table.Column<string>(type: "TEXT", nullable: false),
                    Role = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    WeddingId = table.Column<int>(type: "INTEGER", nullable: true),
                    CreatedDate = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.UserId);
                    table.ForeignKey(
                        name: "FK_Users_Weddings_WeddingId",
                        column: x => x.WeddingId,
                        principalTable: "Weddings",
                        principalColumn: "WeddingId",
                        onDelete: ReferentialAction.SetNull);
                });

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

            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "UserId", "CreatedDate", "Email", "PasswordHash", "Role", "WeddingId" },
                values: new object[] { 1, new DateTime(2026, 1, 28, 5, 10, 28, 163, DateTimeKind.Utc).AddTicks(9250), "admin@wedding-cms.com", "$2a$11$Oecz3llmI4qkDk4J7xaJXueXLtPIlRUpj7OPreN/YkDdvAP55SAby", "SUPER_ADMIN", null });

            migrationBuilder.CreateIndex(
                name: "IX_Users_Email",
                table: "Users",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_WeddingId",
                table: "Users",
                column: "WeddingId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Weddings_Templates_TemplateId",
                table: "Weddings");

            migrationBuilder.DropTable(
                name: "Users");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Templates",
                table: "Templates");

            migrationBuilder.RenameTable(
                name: "Templates",
                newName: "Template");

            migrationBuilder.RenameIndex(
                name: "IX_Templates_TemplateCode",
                table: "Template",
                newName: "IX_Template_TemplateCode");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Template",
                table: "Template",
                column: "TemplateId");

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 1,
                column: "CreatedDate",
                value: new DateTime(2026, 1, 24, 14, 13, 45, 362, DateTimeKind.Utc).AddTicks(6530));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 2,
                column: "CreatedDate",
                value: new DateTime(2026, 1, 24, 14, 13, 45, 362, DateTimeKind.Utc).AddTicks(6620));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 3,
                column: "CreatedDate",
                value: new DateTime(2026, 1, 24, 14, 13, 45, 362, DateTimeKind.Utc).AddTicks(6620));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 4,
                column: "CreatedDate",
                value: new DateTime(2026, 1, 24, 14, 13, 45, 362, DateTimeKind.Utc).AddTicks(6620));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 5,
                column: "CreatedDate",
                value: new DateTime(2026, 1, 24, 14, 13, 45, 362, DateTimeKind.Utc).AddTicks(6620));

            migrationBuilder.UpdateData(
                table: "Template",
                keyColumn: "TemplateId",
                keyValue: 1,
                column: "CreatedDate",
                value: new DateTime(2026, 1, 24, 14, 13, 45, 363, DateTimeKind.Utc).AddTicks(4010));

            migrationBuilder.UpdateData(
                table: "Template",
                keyColumn: "TemplateId",
                keyValue: 2,
                column: "CreatedDate",
                value: new DateTime(2026, 1, 24, 14, 13, 45, 363, DateTimeKind.Utc).AddTicks(4090));

            migrationBuilder.AddForeignKey(
                name: "FK_Weddings_Template_TemplateId",
                table: "Weddings",
                column: "TemplateId",
                principalTable: "Template",
                principalColumn: "TemplateId",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
