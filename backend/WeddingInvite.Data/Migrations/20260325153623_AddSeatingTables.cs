using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WeddingInvite.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddSeatingTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Create Tables table
            migrationBuilder.CreateTable(
                name: "Tables",
                columns: table => new
                {
                    TableId = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    WeddingId = table.Column<int>(type: "INTEGER", nullable: false),
                    TableName = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Capacity = table.Column<int>(type: "INTEGER", nullable: false),
                    SortOrder = table.Column<int>(type: "INTEGER", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Tables", x => x.TableId);
                    table.ForeignKey(
                        name: "FK_Tables_Weddings_WeddingId",
                        column: x => x.WeddingId,
                        principalTable: "Weddings",
                        principalColumn: "WeddingId",
                        onDelete: ReferentialAction.Cascade);
                });

            // Add TableId FK column to Guests
            migrationBuilder.AddColumn<int>(
                name: "TableId",
                table: "Guests",
                type: "INTEGER",
                nullable: true);

            // Seed SEATING feature
            migrationBuilder.InsertData(
                table: "Features",
                columns: new[] { "FeatureId", "CreatedDate", "Description", "FeatureCode", "FeatureName", "IsActive", "IsPremium", "SortOrder" },
                values: new object[] { 6, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Assign guests to tables and manage seating arrangements", "SEATING", "Seating Management", true, true, 4 });

            migrationBuilder.InsertData(
                table: "PackageFeatures",
                columns: new[] { "PackageFeatureId", "FeatureId", "PackageId" },
                values: new object[] { 6, 6, 2 });

            migrationBuilder.CreateIndex(
                name: "IX_Guests_TableId",
                table: "Guests",
                column: "TableId");

            migrationBuilder.CreateIndex(
                name: "IX_Tables_WeddingId",
                table: "Tables",
                column: "WeddingId");

            migrationBuilder.AddForeignKey(
                name: "FK_Guests_Tables_TableId",
                table: "Guests",
                column: "TableId",
                principalTable: "Tables",
                principalColumn: "TableId",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 1,
                column: "CreatedDate",
                value: new DateTime(2026, 3, 25, 15, 36, 22, 846, DateTimeKind.Utc).AddTicks(80));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 2,
                column: "CreatedDate",
                value: new DateTime(2026, 3, 25, 15, 36, 22, 846, DateTimeKind.Utc).AddTicks(170));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 3,
                column: "CreatedDate",
                value: new DateTime(2026, 3, 25, 15, 36, 22, 846, DateTimeKind.Utc).AddTicks(170));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 4,
                column: "CreatedDate",
                value: new DateTime(2026, 3, 25, 15, 36, 22, 846, DateTimeKind.Utc).AddTicks(170));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 5,
                column: "CreatedDate",
                value: new DateTime(2026, 3, 25, 15, 36, 22, 846, DateTimeKind.Utc).AddTicks(170));

            migrationBuilder.UpdateData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 1,
                column: "CreatedDate",
                value: new DateTime(2026, 3, 25, 15, 36, 22, 849, DateTimeKind.Utc).AddTicks(260));

            migrationBuilder.UpdateData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 2,
                column: "CreatedDate",
                value: new DateTime(2026, 3, 25, 15, 36, 22, 849, DateTimeKind.Utc).AddTicks(370));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                columns: new[] { "CreatedDate", "PasswordHash" },
                values: new object[] { new DateTime(2026, 3, 25, 15, 36, 23, 19, DateTimeKind.Utc).AddTicks(1580), "$2a$11$bGJ3TdGLEz3txAGoD8VmOuex2KS4iyv6o.EW4cCxeYYcqmsXpQtKW" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Guests_Tables_TableId",
                table: "Guests");

            migrationBuilder.DropTable(name: "Tables");

            migrationBuilder.DropIndex(
                name: "IX_Guests_TableId",
                table: "Guests");

            migrationBuilder.DropColumn(
                name: "TableId",
                table: "Guests");

            migrationBuilder.DeleteData(
                table: "PackageFeatures",
                keyColumn: "PackageFeatureId",
                keyValue: 6);

            migrationBuilder.DeleteData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 6);

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 1,
                column: "CreatedDate",
                value: new DateTime(2026, 3, 25, 10, 4, 37, 733, DateTimeKind.Utc).AddTicks(9320));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 2,
                column: "CreatedDate",
                value: new DateTime(2026, 3, 25, 10, 4, 37, 733, DateTimeKind.Utc).AddTicks(9410));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 3,
                column: "CreatedDate",
                value: new DateTime(2026, 3, 25, 10, 4, 37, 733, DateTimeKind.Utc).AddTicks(9410));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 4,
                column: "CreatedDate",
                value: new DateTime(2026, 3, 25, 10, 4, 37, 733, DateTimeKind.Utc).AddTicks(9410));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 5,
                column: "CreatedDate",
                value: new DateTime(2026, 3, 25, 10, 4, 37, 733, DateTimeKind.Utc).AddTicks(9410));

            migrationBuilder.UpdateData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 1,
                column: "CreatedDate",
                value: new DateTime(2026, 3, 25, 10, 4, 37, 736, DateTimeKind.Utc).AddTicks(6880));

            migrationBuilder.UpdateData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 2,
                column: "CreatedDate",
                value: new DateTime(2026, 3, 25, 10, 4, 37, 736, DateTimeKind.Utc).AddTicks(6960));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                columns: new[] { "CreatedDate", "PasswordHash" },
                values: new object[] { new DateTime(2026, 3, 25, 10, 4, 37, 902, DateTimeKind.Utc).AddTicks(6020), "$2a$11$RMu88giGwlpYyVcXSAo1aOPnMfdF0zMT3xFyN9MvUsLLoYX2HxQya" });
        }
    }
}
