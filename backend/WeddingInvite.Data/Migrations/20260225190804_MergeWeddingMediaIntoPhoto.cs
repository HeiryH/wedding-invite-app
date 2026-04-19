using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WeddingInvite.Data.Migrations
{
    /// <inheritdoc />
    public partial class MergeWeddingMediaIntoPhoto : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "WeddingMedia");

            migrationBuilder.AddColumn<int>(
                name: "TemplateSlot",
                table: "Photos",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UploadedBy",
                table: "Photos",
                type: "TEXT",
                maxLength: 20,
                nullable: false,
                defaultValue: "GUEST");

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 1,
                column: "CreatedDate",
                value: new DateTime(2026, 2, 25, 19, 8, 3, 715, DateTimeKind.Utc).AddTicks(7850));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 2,
                column: "CreatedDate",
                value: new DateTime(2026, 2, 25, 19, 8, 3, 715, DateTimeKind.Utc).AddTicks(7950));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 3,
                column: "CreatedDate",
                value: new DateTime(2026, 2, 25, 19, 8, 3, 715, DateTimeKind.Utc).AddTicks(7950));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 4,
                column: "CreatedDate",
                value: new DateTime(2026, 2, 25, 19, 8, 3, 715, DateTimeKind.Utc).AddTicks(7950));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 5,
                column: "CreatedDate",
                value: new DateTime(2026, 2, 25, 19, 8, 3, 715, DateTimeKind.Utc).AddTicks(7960));

            migrationBuilder.UpdateData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 1,
                column: "CreatedDate",
                value: new DateTime(2026, 2, 25, 19, 8, 3, 719, DateTimeKind.Utc).AddTicks(380));

            migrationBuilder.UpdateData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 2,
                column: "CreatedDate",
                value: new DateTime(2026, 2, 25, 19, 8, 3, 719, DateTimeKind.Utc).AddTicks(460));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                columns: new[] { "CreatedDate", "PasswordHash" },
                values: new object[] { new DateTime(2026, 2, 25, 19, 8, 3, 875, DateTimeKind.Utc).AddTicks(3510), "$2a$11$htkRsLPkZWKi81D4ZUn.pOsl2H5hk6nPXQWBLY/sFxo0VFk03UF26" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TemplateSlot",
                table: "Photos");

            migrationBuilder.DropColumn(
                name: "UploadedBy",
                table: "Photos");

            migrationBuilder.CreateTable(
                name: "WeddingMedia",
                columns: table => new
                {
                    WeddingMediaId = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    WeddingId = table.Column<int>(type: "INTEGER", nullable: false),
                    ContentType = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    FileName = table.Column<string>(type: "TEXT", maxLength: 255, nullable: false),
                    FilePath = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false),
                    FileSize = table.Column<long>(type: "INTEGER", nullable: false),
                    MediaType = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    MediaUrl = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false),
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
    }
}
