using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WeddingInvite.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddTemplateConfigDefault : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
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
                keyValue: 1,
                column: "CreatedDate",
                value: new DateTime(2026, 7, 22, 12, 49, 32, 866, DateTimeKind.Utc).AddTicks(4000));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 2,
                column: "CreatedDate",
                value: new DateTime(2026, 7, 22, 12, 49, 32, 866, DateTimeKind.Utc).AddTicks(4090));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 3,
                column: "CreatedDate",
                value: new DateTime(2026, 7, 22, 12, 49, 32, 866, DateTimeKind.Utc).AddTicks(4100));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 4,
                column: "CreatedDate",
                value: new DateTime(2026, 7, 22, 12, 49, 32, 866, DateTimeKind.Utc).AddTicks(4100));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 5,
                column: "CreatedDate",
                value: new DateTime(2026, 7, 22, 12, 49, 32, 866, DateTimeKind.Utc).AddTicks(4100));

            migrationBuilder.UpdateData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 1,
                column: "CreatedDate",
                value: new DateTime(2026, 7, 22, 12, 49, 32, 869, DateTimeKind.Utc).AddTicks(3650));

            migrationBuilder.UpdateData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 2,
                column: "CreatedDate",
                value: new DateTime(2026, 7, 22, 12, 49, 32, 869, DateTimeKind.Utc).AddTicks(3740));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                columns: new[] { "CreatedDate", "PasswordHash" },
                values: new object[] { new DateTime(2026, 7, 22, 12, 49, 33, 54, DateTimeKind.Utc).AddTicks(4200), "$2a$11$TfVUn4htwXn7mlH5qmzMM.rI0KTnSg9VBBWC.hcn1eOCRl9Lxs872" });

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

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 1,
                column: "CreatedDate",
                value: new DateTime(2026, 7, 20, 11, 57, 3, 370, DateTimeKind.Utc).AddTicks(3910));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 2,
                column: "CreatedDate",
                value: new DateTime(2026, 7, 20, 11, 57, 3, 370, DateTimeKind.Utc).AddTicks(4000));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 3,
                column: "CreatedDate",
                value: new DateTime(2026, 7, 20, 11, 57, 3, 370, DateTimeKind.Utc).AddTicks(4000));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 4,
                column: "CreatedDate",
                value: new DateTime(2026, 7, 20, 11, 57, 3, 370, DateTimeKind.Utc).AddTicks(4000));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 5,
                column: "CreatedDate",
                value: new DateTime(2026, 7, 20, 11, 57, 3, 370, DateTimeKind.Utc).AddTicks(4000));

            migrationBuilder.UpdateData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 1,
                column: "CreatedDate",
                value: new DateTime(2026, 7, 20, 11, 57, 3, 372, DateTimeKind.Utc).AddTicks(9700));

            migrationBuilder.UpdateData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 2,
                column: "CreatedDate",
                value: new DateTime(2026, 7, 20, 11, 57, 3, 372, DateTimeKind.Utc).AddTicks(9820));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                columns: new[] { "CreatedDate", "PasswordHash" },
                values: new object[] { new DateTime(2026, 7, 20, 11, 57, 3, 543, DateTimeKind.Utc).AddTicks(5160), "$2a$11$fhtovvfQsvQ0h6xkl/L8gurGK94RdeuQRDtOz8PAIfjFT2/tuvEvm" });
        }
    }
}
