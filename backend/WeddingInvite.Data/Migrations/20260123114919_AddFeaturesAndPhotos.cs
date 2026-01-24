using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace WeddingInvite.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddFeaturesAndPhotos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Features",
                columns: table => new
                {
                    FeatureId = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    FeatureCode = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    FeatureName = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false),
                    IsPremium = table.Column<bool>(type: "INTEGER", nullable: false),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    SortOrder = table.Column<int>(type: "INTEGER", nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Features", x => x.FeatureId);
                });

            migrationBuilder.CreateTable(
                name: "Photos",
                columns: table => new
                {
                    PhotoId = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    WeddingId = table.Column<int>(type: "INTEGER", nullable: false),
                    GuestName = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    FileName = table.Column<string>(type: "TEXT", maxLength: 255, nullable: false),
                    FilePath = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false),
                    FileSize = table.Column<long>(type: "INTEGER", nullable: false),
                    ContentType = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    Caption = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false),
                    IsApproved = table.Column<bool>(type: "INTEGER", nullable: false),
                    IsVisible = table.Column<bool>(type: "INTEGER", nullable: false),
                    UploadedDate = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Photos", x => x.PhotoId);
                    table.ForeignKey(
                        name: "FK_Photos_Weddings_WeddingId",
                        column: x => x.WeddingId,
                        principalTable: "Weddings",
                        principalColumn: "WeddingId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "WeddingFeatures",
                columns: table => new
                {
                    WeddingFeatureId = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    WeddingId = table.Column<int>(type: "INTEGER", nullable: false),
                    FeatureId = table.Column<int>(type: "INTEGER", nullable: false),
                    IsEnabled = table.Column<bool>(type: "INTEGER", nullable: false),
                    Configuration = table.Column<string>(type: "TEXT", nullable: true),
                    EnabledDate = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WeddingFeatures", x => x.WeddingFeatureId);
                    table.ForeignKey(
                        name: "FK_WeddingFeatures_Features_FeatureId",
                        column: x => x.FeatureId,
                        principalTable: "Features",
                        principalColumn: "FeatureId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_WeddingFeatures_Weddings_WeddingId",
                        column: x => x.WeddingId,
                        principalTable: "Weddings",
                        principalColumn: "WeddingId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "Features",
                columns: new[] { "FeatureId", "CreatedDate", "Description", "FeatureCode", "FeatureName", "IsActive", "IsPremium", "SortOrder" },
                values: new object[,]
                {
                    { 1, new DateTime(2026, 1, 23, 11, 49, 19, 186, DateTimeKind.Utc).AddTicks(6290), "Allow guests to upload and share photos from the wedding", "PHOTO_BOOTH", "Photo Booth", true, true, 1 },
                    { 2, new DateTime(2026, 1, 23, 11, 49, 19, 186, DateTimeKind.Utc).AddTicks(6370), "Online gift registry with payment links", "E_GIFTS", "E-Gifts Registry", false, true, 2 },
                    { 3, new DateTime(2026, 1, 23, 11, 49, 19, 186, DateTimeKind.Utc).AddTicks(6370), "Use your own domain name (e.g., johnandmary.wedding)", "CUSTOM_DOMAIN", "Custom Domain", false, true, 3 },
                    { 4, new DateTime(2026, 1, 23, 11, 49, 19, 186, DateTimeKind.Utc).AddTicks(6370), "Guest RSVP and attendance tracking", "RSVP", "RSVP Management", true, false, 0 },
                    { 5, new DateTime(2026, 1, 23, 11, 49, 19, 186, DateTimeKind.Utc).AddTicks(6370), "Guests can leave wishes and messages", "WISHES", "Wishes & Guestbook", true, false, 0 }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Features_FeatureCode",
                table: "Features",
                column: "FeatureCode",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Photos_WeddingId",
                table: "Photos",
                column: "WeddingId");

            migrationBuilder.CreateIndex(
                name: "IX_WeddingFeatures_FeatureId",
                table: "WeddingFeatures",
                column: "FeatureId");

            migrationBuilder.CreateIndex(
                name: "IX_WeddingFeatures_WeddingId_FeatureId",
                table: "WeddingFeatures",
                columns: new[] { "WeddingId", "FeatureId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Photos");

            migrationBuilder.DropTable(
                name: "WeddingFeatures");

            migrationBuilder.DropTable(
                name: "Features");
        }
    }
}
