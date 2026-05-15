using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WeddingInvite.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddItinerary : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ItineraryItems",
                columns: table => new
                {
                    ItineraryItemId = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    WeddingId = table.Column<int>(type: "INTEGER", nullable: false),
                    Label = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    Detail = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false),
                    SortOrder = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ItineraryItems", x => x.ItineraryItemId);
                    table.ForeignKey(
                        name: "FK_ItineraryItems_Weddings_WeddingId",
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
                value: new DateTime(2026, 4, 29, 11, 19, 16, 165, DateTimeKind.Utc).AddTicks(8750));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 2,
                column: "CreatedDate",
                value: new DateTime(2026, 4, 29, 11, 19, 16, 165, DateTimeKind.Utc).AddTicks(8830));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 3,
                column: "CreatedDate",
                value: new DateTime(2026, 4, 29, 11, 19, 16, 165, DateTimeKind.Utc).AddTicks(8830));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 4,
                column: "CreatedDate",
                value: new DateTime(2026, 4, 29, 11, 19, 16, 165, DateTimeKind.Utc).AddTicks(8830));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 5,
                column: "CreatedDate",
                value: new DateTime(2026, 4, 29, 11, 19, 16, 165, DateTimeKind.Utc).AddTicks(8830));

            migrationBuilder.UpdateData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 1,
                column: "CreatedDate",
                value: new DateTime(2026, 4, 29, 11, 19, 16, 168, DateTimeKind.Utc).AddTicks(6790));

            migrationBuilder.UpdateData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 2,
                column: "CreatedDate",
                value: new DateTime(2026, 4, 29, 11, 19, 16, 168, DateTimeKind.Utc).AddTicks(6880));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                columns: new[] { "CreatedDate", "PasswordHash" },
                values: new object[] { new DateTime(2026, 4, 29, 11, 19, 16, 340, DateTimeKind.Utc).AddTicks(1450), "$2a$11$y.Zt3NzFk0vyJE5V1rb75uDOhIt9sRBnK0YFnUC9h0.swdyf7ZAi6" });

            migrationBuilder.CreateIndex(
                name: "IX_ItineraryItems_WeddingId",
                table: "ItineraryItems",
                column: "WeddingId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ItineraryItems");

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 1,
                column: "CreatedDate",
                value: new DateTime(2026, 4, 17, 23, 45, 43, 611, DateTimeKind.Utc).AddTicks(5060));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 2,
                column: "CreatedDate",
                value: new DateTime(2026, 4, 17, 23, 45, 43, 611, DateTimeKind.Utc).AddTicks(5150));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 3,
                column: "CreatedDate",
                value: new DateTime(2026, 4, 17, 23, 45, 43, 611, DateTimeKind.Utc).AddTicks(5150));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 4,
                column: "CreatedDate",
                value: new DateTime(2026, 4, 17, 23, 45, 43, 611, DateTimeKind.Utc).AddTicks(5150));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 5,
                column: "CreatedDate",
                value: new DateTime(2026, 4, 17, 23, 45, 43, 611, DateTimeKind.Utc).AddTicks(5160));

            migrationBuilder.UpdateData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 1,
                column: "CreatedDate",
                value: new DateTime(2026, 4, 17, 23, 45, 43, 614, DateTimeKind.Utc).AddTicks(6320));

            migrationBuilder.UpdateData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 2,
                column: "CreatedDate",
                value: new DateTime(2026, 4, 17, 23, 45, 43, 614, DateTimeKind.Utc).AddTicks(6420));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                columns: new[] { "CreatedDate", "PasswordHash" },
                values: new object[] { new DateTime(2026, 4, 17, 23, 45, 43, 774, DateTimeKind.Utc).AddTicks(6680), "$2a$11$08VGDBs79qcXoOvR.cZpy.Iwu7ZCYgpyy.vmrXtAdAyQ6VHjB7aJW" });
        }
    }
}
