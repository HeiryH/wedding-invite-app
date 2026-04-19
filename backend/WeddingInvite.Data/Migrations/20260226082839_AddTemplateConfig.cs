using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WeddingInvite.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddTemplateConfig : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "GuestName",
                table: "Photos",
                type: "TEXT",
                maxLength: 100,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "TEXT",
                oldMaxLength: 100);

            migrationBuilder.CreateTable(
                name: "TemplateConfigs",
                columns: table => new
                {
                    WeddingTemplateConfigId = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    WeddingId = table.Column<int>(type: "INTEGER", nullable: false),
                    ConfigKey = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    ConfigValue = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: false),
                    UpdatedDate = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TemplateConfigs", x => x.WeddingTemplateConfigId);
                    table.ForeignKey(
                        name: "FK_TemplateConfigs_Weddings_WeddingId",
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
                value: new DateTime(2026, 2, 26, 8, 28, 39, 99, DateTimeKind.Utc).AddTicks(9830));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 2,
                column: "CreatedDate",
                value: new DateTime(2026, 2, 26, 8, 28, 39, 99, DateTimeKind.Utc).AddTicks(9920));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 3,
                column: "CreatedDate",
                value: new DateTime(2026, 2, 26, 8, 28, 39, 99, DateTimeKind.Utc).AddTicks(9920));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 4,
                column: "CreatedDate",
                value: new DateTime(2026, 2, 26, 8, 28, 39, 99, DateTimeKind.Utc).AddTicks(9920));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 5,
                column: "CreatedDate",
                value: new DateTime(2026, 2, 26, 8, 28, 39, 99, DateTimeKind.Utc).AddTicks(9920));

            migrationBuilder.UpdateData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 1,
                column: "CreatedDate",
                value: new DateTime(2026, 2, 26, 8, 28, 39, 102, DateTimeKind.Utc).AddTicks(6560));

            migrationBuilder.UpdateData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 2,
                column: "CreatedDate",
                value: new DateTime(2026, 2, 26, 8, 28, 39, 102, DateTimeKind.Utc).AddTicks(6640));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                columns: new[] { "CreatedDate", "PasswordHash" },
                values: new object[] { new DateTime(2026, 2, 26, 8, 28, 39, 272, DateTimeKind.Utc).AddTicks(640), "$2a$11$gm2difYpQOYBa/O6BJf.9.d0LUZvgML1alF9cyoz6yKlnj3e7Eu9C" });

            migrationBuilder.CreateIndex(
                name: "IX_TemplateConfigs_WeddingId_ConfigKey",
                table: "TemplateConfigs",
                columns: new[] { "WeddingId", "ConfigKey" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TemplateConfigs");

            migrationBuilder.AlterColumn<string>(
                name: "GuestName",
                table: "Photos",
                type: "TEXT",
                maxLength: 100,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "TEXT",
                oldMaxLength: 100,
                oldNullable: true);

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
    }
}
