using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace WeddingInvite.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddPackages : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "PackageId",
                table: "Weddings",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Packages",
                columns: table => new
                {
                    PackageId = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    PackageName = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    PackageCode = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    Description = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false),
                    Price = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    SortOrder = table.Column<int>(type: "INTEGER", nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Packages", x => x.PackageId);
                });

            migrationBuilder.CreateTable(
                name: "PackageFeatures",
                columns: table => new
                {
                    PackageFeatureId = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    PackageId = table.Column<int>(type: "INTEGER", nullable: false),
                    FeatureId = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PackageFeatures", x => x.PackageFeatureId);
                    table.ForeignKey(
                        name: "FK_PackageFeatures_Features_FeatureId",
                        column: x => x.FeatureId,
                        principalTable: "Features",
                        principalColumn: "FeatureId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PackageFeatures_Packages_PackageId",
                        column: x => x.PackageId,
                        principalTable: "Packages",
                        principalColumn: "PackageId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 1,
                column: "CreatedDate",
                value: new DateTime(2026, 2, 24, 18, 56, 14, 383, DateTimeKind.Utc).AddTicks(2190));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 2,
                column: "CreatedDate",
                value: new DateTime(2026, 2, 24, 18, 56, 14, 383, DateTimeKind.Utc).AddTicks(2270));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 3,
                column: "CreatedDate",
                value: new DateTime(2026, 2, 24, 18, 56, 14, 383, DateTimeKind.Utc).AddTicks(2270));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 4,
                column: "CreatedDate",
                value: new DateTime(2026, 2, 24, 18, 56, 14, 383, DateTimeKind.Utc).AddTicks(2270));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 5,
                column: "CreatedDate",
                value: new DateTime(2026, 2, 24, 18, 56, 14, 383, DateTimeKind.Utc).AddTicks(2280));

            migrationBuilder.InsertData(
                table: "Packages",
                columns: new[] { "PackageId", "CreatedDate", "Description", "IsActive", "PackageCode", "PackageName", "Price", "SortOrder" },
                values: new object[,]
                {
                    { 1, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Basic wedding invitation with RSVP and guestbook", true, "STARTER", "Starter", 0m, 1 },
                    { 2, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Full-featured wedding invitation with photo booth, RSVP, and guestbook", true, "PREMIUM", "Premium", 99m, 2 }
                });

            migrationBuilder.UpdateData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 1,
                column: "CreatedDate",
                value: new DateTime(2026, 2, 24, 18, 56, 14, 384, DateTimeKind.Utc).AddTicks(6600));

            migrationBuilder.UpdateData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 2,
                column: "CreatedDate",
                value: new DateTime(2026, 2, 24, 18, 56, 14, 384, DateTimeKind.Utc).AddTicks(6690));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                columns: new[] { "CreatedDate", "PasswordHash" },
                values: new object[] { new DateTime(2026, 2, 24, 18, 56, 14, 558, DateTimeKind.Utc).AddTicks(7400), "$2a$11$5K6o0GmspKYpxoHnqr.hvOxxrVeQouTweCs6kecLd5G6sS9BYu84K" });

            migrationBuilder.InsertData(
                table: "PackageFeatures",
                columns: new[] { "PackageFeatureId", "FeatureId", "PackageId" },
                values: new object[,]
                {
                    { 1, 4, 1 },
                    { 2, 5, 1 },
                    { 3, 1, 2 },
                    { 4, 4, 2 },
                    { 5, 5, 2 }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Weddings_PackageId",
                table: "Weddings",
                column: "PackageId");

            migrationBuilder.CreateIndex(
                name: "IX_PackageFeatures_FeatureId",
                table: "PackageFeatures",
                column: "FeatureId");

            migrationBuilder.CreateIndex(
                name: "IX_PackageFeatures_PackageId_FeatureId",
                table: "PackageFeatures",
                columns: new[] { "PackageId", "FeatureId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Packages_PackageCode",
                table: "Packages",
                column: "PackageCode",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Packages_PackageName",
                table: "Packages",
                column: "PackageName",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Weddings_Packages_PackageId",
                table: "Weddings",
                column: "PackageId",
                principalTable: "Packages",
                principalColumn: "PackageId",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Weddings_Packages_PackageId",
                table: "Weddings");

            migrationBuilder.DropTable(
                name: "PackageFeatures");

            migrationBuilder.DropTable(
                name: "Packages");

            migrationBuilder.DropIndex(
                name: "IX_Weddings_PackageId",
                table: "Weddings");

            migrationBuilder.DropColumn(
                name: "PackageId",
                table: "Weddings");

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
        }
    }
}
