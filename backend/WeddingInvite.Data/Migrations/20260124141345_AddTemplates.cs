using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace WeddingInvite.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddTemplates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Template",
                columns: table => new
                {
                    TemplateId = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    TemplateName = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    TemplateCode = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    Description = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false),
                    ThumbnailUrl = table.Column<string>(type: "TEXT", nullable: false),
                    PrimaryColor = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    SecondaryColor = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    ComponentPath = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    IsPremium = table.Column<bool>(type: "INTEGER", nullable: false),
                    SortOrder = table.Column<int>(type: "INTEGER", nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Template", x => x.TemplateId);
                });

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

            migrationBuilder.InsertData(
                table: "Template",
                columns: new[] { "TemplateId", "ComponentPath", "CreatedDate", "Description", "IsActive", "IsPremium", "PrimaryColor", "SecondaryColor", "SortOrder", "TemplateCode", "TemplateName", "ThumbnailUrl" },
                values: new object[,]
                {
                    { 1, "Template1", new DateTime(2026, 1, 24, 14, 13, 45, 363, DateTimeKind.Utc).AddTicks(4010), "Elegant rose and pink design with top navigation", true, false, "#f43f5e", "#ec4899", 1, "classic-rose", "Classic Rose", "" },
                    { 2, "Template2", new DateTime(2026, 1, 24, 14, 13, 45, 363, DateTimeKind.Utc).AddTicks(4090), "Luxurious yellow and gold single-page design with floating navigation", true, true, "#eab308", "#f59e0b", 2, "golden-elegance", "Golden Elegance", "" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Weddings_TemplateId",
                table: "Weddings",
                column: "TemplateId");

            migrationBuilder.CreateIndex(
                name: "IX_Template_TemplateCode",
                table: "Template",
                column: "TemplateCode",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Weddings_Template_TemplateId",
                table: "Weddings",
                column: "TemplateId",
                principalTable: "Template",
                principalColumn: "TemplateId",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Weddings_Template_TemplateId",
                table: "Weddings");

            migrationBuilder.DropTable(
                name: "Template");

            migrationBuilder.DropIndex(
                name: "IX_Weddings_TemplateId",
                table: "Weddings");

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 1,
                column: "CreatedDate",
                value: new DateTime(2026, 1, 23, 11, 49, 19, 186, DateTimeKind.Utc).AddTicks(6290));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 2,
                column: "CreatedDate",
                value: new DateTime(2026, 1, 23, 11, 49, 19, 186, DateTimeKind.Utc).AddTicks(6370));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 3,
                column: "CreatedDate",
                value: new DateTime(2026, 1, 23, 11, 49, 19, 186, DateTimeKind.Utc).AddTicks(6370));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 4,
                column: "CreatedDate",
                value: new DateTime(2026, 1, 23, 11, 49, 19, 186, DateTimeKind.Utc).AddTicks(6370));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 5,
                column: "CreatedDate",
                value: new DateTime(2026, 1, 23, 11, 49, 19, 186, DateTimeKind.Utc).AddTicks(6370));
        }
    }
}
