using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WeddingInvite.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Weddings",
                columns: table => new
                {
                    WeddingId = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    CoupleName = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    BrideName = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    GroomName = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    WeddingDate = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Venue = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    VenueAddress = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false),
                    TemplateId = table.Column<int>(type: "INTEGER", nullable: false),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Weddings", x => x.WeddingId);
                });

            migrationBuilder.CreateTable(
                name: "Guests",
                columns: table => new
                {
                    GuestId = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    WeddingId = table.Column<int>(type: "INTEGER", nullable: false),
                    GuestName = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Email = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    PhoneNumber = table.Column<string>(type: "TEXT", nullable: false),
                    BrideOrGroomSide = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    NumberOfAttendees = table.Column<int>(type: "INTEGER", nullable: false),
                    SongRequest = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    IsAttending = table.Column<bool>(type: "INTEGER", nullable: false),
                    RespondedDate = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Guests", x => x.GuestId);
                    table.ForeignKey(
                        name: "FK_Guests_Weddings_WeddingId",
                        column: x => x.WeddingId,
                        principalTable: "Weddings",
                        principalColumn: "WeddingId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Wishes",
                columns: table => new
                {
                    WishId = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    WeddingId = table.Column<int>(type: "INTEGER", nullable: false),
                    GuestName = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Message = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Wishes", x => x.WishId);
                    table.ForeignKey(
                        name: "FK_Wishes_Weddings_WeddingId",
                        column: x => x.WeddingId,
                        principalTable: "Weddings",
                        principalColumn: "WeddingId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Guests_WeddingId",
                table: "Guests",
                column: "WeddingId");

            migrationBuilder.CreateIndex(
                name: "IX_Weddings_CoupleName",
                table: "Weddings",
                column: "CoupleName",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Wishes_WeddingId",
                table: "Wishes",
                column: "WeddingId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Guests");

            migrationBuilder.DropTable(
                name: "Wishes");

            migrationBuilder.DropTable(
                name: "Weddings");
        }
    }
}
