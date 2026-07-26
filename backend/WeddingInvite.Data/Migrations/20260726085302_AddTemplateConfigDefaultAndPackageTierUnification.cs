using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace WeddingInvite.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddTemplateConfigDefaultAndPackageTierUnification : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Weddings_Packages_PackageId",
                table: "Weddings");

            migrationBuilder.DropIndex(
                name: "IX_Weddings_PackageId",
                table: "Weddings");

            migrationBuilder.DropColumn(
                name: "PackageId",
                table: "Weddings");

            migrationBuilder.CreateTable(
                name: "TemplateConfigDefaults",
                columns: table => new
                {
                    TemplateConfigDefaultId = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    TemplateId = table.Column<int>(type: "INTEGER", nullable: false),
                    ConfigKey = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    ConfigValue = table.Column<string>(type: "TEXT", maxLength: 4000, nullable: false),
                    UpdatedDate = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TemplateConfigDefaults", x => x.TemplateConfigDefaultId);
                    table.ForeignKey(
                        name: "FK_TemplateConfigDefaults_Templates_TemplateId",
                        column: x => x.TemplateId,
                        principalTable: "Templates",
                        principalColumn: "TemplateId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 3,
                column: "IsActive",
                value: true);

            migrationBuilder.UpdateData(
                table: "Packages",
                keyColumn: "PackageId",
                keyValue: 1,
                columns: new[] { "PackageCode", "PackageName" },
                values: new object[] { "FREE", "Free" });

            migrationBuilder.InsertData(
                table: "Packages",
                columns: new[] { "PackageId", "CreatedDate", "Description", "IsActive", "PackageCode", "PackageName", "Price", "SortOrder" },
                values: new object[] { 3, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Everything in Premium, plus your own custom domain", true, "PRO", "Pro", 199m, 3 });

            migrationBuilder.InsertData(
                table: "PackageFeatures",
                columns: new[] { "PackageFeatureId", "FeatureId", "PackageId" },
                values: new object[,]
                {
                    { 7, 1, 3 },
                    { 8, 3, 3 },
                    { 9, 4, 3 },
                    { 10, 5, 3 },
                    { 11, 6, 3 }
                });

            migrationBuilder.CreateIndex(
                name: "IX_TemplateConfigDefaults_TemplateId_ConfigKey",
                table: "TemplateConfigDefaults",
                columns: new[] { "TemplateId", "ConfigKey" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TemplateConfigDefaults");

            migrationBuilder.DeleteData(
                table: "PackageFeatures",
                keyColumn: "PackageFeatureId",
                keyValue: 7);

            migrationBuilder.DeleteData(
                table: "PackageFeatures",
                keyColumn: "PackageFeatureId",
                keyValue: 8);

            migrationBuilder.DeleteData(
                table: "PackageFeatures",
                keyColumn: "PackageFeatureId",
                keyValue: 9);

            migrationBuilder.DeleteData(
                table: "PackageFeatures",
                keyColumn: "PackageFeatureId",
                keyValue: 10);

            migrationBuilder.DeleteData(
                table: "PackageFeatures",
                keyColumn: "PackageFeatureId",
                keyValue: 11);

            migrationBuilder.DeleteData(
                table: "Packages",
                keyColumn: "PackageId",
                keyValue: 3);

            migrationBuilder.AddColumn<int>(
                name: "PackageId",
                table: "Weddings",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 3,
                column: "IsActive",
                value: false);

            migrationBuilder.UpdateData(
                table: "Packages",
                keyColumn: "PackageId",
                keyValue: 1,
                columns: new[] { "PackageCode", "PackageName" },
                values: new object[] { "STARTER", "Starter" });

            migrationBuilder.CreateIndex(
                name: "IX_Weddings_PackageId",
                table: "Weddings",
                column: "PackageId");

            migrationBuilder.AddForeignKey(
                name: "FK_Weddings_Packages_PackageId",
                table: "Weddings",
                column: "PackageId",
                principalTable: "Packages",
                principalColumn: "PackageId",
                onDelete: ReferentialAction.SetNull);
        }
    }
}
