using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WeddingInvite.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddWeddingMedia : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "WeddingMedia",
                columns: table => new
                {
                    WeddingMediaId = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    WeddingId = table.Column<int>(type: "INTEGER", nullable: false),
                    MediaType = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    FileName = table.Column<string>(type: "TEXT", maxLength: 255, nullable: false),
                    FilePath = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false),
                    MediaUrl = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false),
                    ContentType = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    FileSize = table.Column<long>(type: "INTEGER", nullable: false),
                    UploadedDate = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WeddingMedia", x => x.WeddingMediaId);
                    table.ForeignKey(
                        name: "FK_WeddingMedia_Weddings_WeddingId",
                        column: x => x.WeddingId,
                        principalTable: "Weddings",
                        principalColumn: "WeddingId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 1,
                column: "CreatedDate",
                value: new DateTime(2026, 2, 25, 18, 8, 50, 316, DateTimeKind.Utc).AddTicks(1390));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 2,
                column: "CreatedDate",
                value: new DateTime(2026, 2, 25, 18, 8, 50, 316, DateTimeKind.Utc).AddTicks(1470));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 3,
                column: "CreatedDate",
                value: new DateTime(2026, 2, 25, 18, 8, 50, 316, DateTimeKind.Utc).AddTicks(1470));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 4,
                column: "CreatedDate",
                value: new DateTime(2026, 2, 25, 18, 8, 50, 316, DateTimeKind.Utc).AddTicks(1480));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 5,
                column: "CreatedDate",
                value: new DateTime(2026, 2, 25, 18, 8, 50, 316, DateTimeKind.Utc).AddTicks(1480));

            migrationBuilder.UpdateData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 1,
                column: "CreatedDate",
                value: new DateTime(2026, 2, 25, 18, 8, 50, 317, DateTimeKind.Utc).AddTicks(5630));

            migrationBuilder.UpdateData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 2,
                column: "CreatedDate",
                value: new DateTime(2026, 2, 25, 18, 8, 50, 317, DateTimeKind.Utc).AddTicks(5720));

            migrationBuilder.InsertData(
                table: "Templates",
                columns: new[] { "TemplateId", "ComponentPath", "CreatedDate", "Description", "IsActive", "IsPremium", "PrimaryColor", "SecondaryColor", "SortOrder", "TemplateCode", "TemplateName", "ThumbnailUrl" },
                values: new object[] { 3, "Template3", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Botanical green theme with couple portrait and extra image slots", true, true, "#16a34a", "#86efac", 3, "garden-romance", "Garden Romance", "" });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                columns: new[] { "CreatedDate", "PasswordHash" },
                values: new object[] { new DateTime(2026, 2, 25, 18, 8, 50, 485, DateTimeKind.Utc).AddTicks(200), "$2a$11$o6awAOPCfK1hFFjNOmW7Vui4h1nfdcUA/ZdURp/Vn5fLATEYzNHz6" });

            migrationBuilder.CreateIndex(
                name: "IX_WeddingMedia_WeddingId_MediaType",
                table: "WeddingMedia",
                columns: new[] { "WeddingId", "MediaType" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "WeddingMedia");

            migrationBuilder.DeleteData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 3);

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
        }
    }
}
