using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WeddingInvite.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddWeddingCustomDomain : Migration
    {
        // NOTE: EF also scaffolded spurious UpdateData ops for Features/Templates/Users
        // CreatedDate + the admin PasswordHash, because those seeds use non-deterministic
        // values (DateTime.UtcNow / BCrypt.HashPassword at model-build time). They were
        // removed by hand — this migration is purely the custom-domain schema change.
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Domain",
                table: "Weddings",
                type: "TEXT",
                maxLength: 253,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Weddings_Domain",
                table: "Weddings",
                column: "Domain",
                unique: true,
                filter: "[Domain] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Weddings_Domain",
                table: "Weddings");

            migrationBuilder.DropColumn(
                name: "Domain",
                table: "Weddings");
        }
    }
}
