using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WeddingInvite.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddTemplateStagesJson : Migration
    {
        // Hand-written rather than `dotnet ef migrations add` — the current model source has other
        // uncommitted, unrelated in-flight changes (Package/tier work) that a full model diff would
        // pull in. This migration is scoped to exactly the two Template columns it's named for.

        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsAuthored",
                table: "Templates",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "StagesJson",
                table: "Templates",
                type: "TEXT",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsAuthored",
                table: "Templates");

            migrationBuilder.DropColumn(
                name: "StagesJson",
                table: "Templates");
        }
    }
}
