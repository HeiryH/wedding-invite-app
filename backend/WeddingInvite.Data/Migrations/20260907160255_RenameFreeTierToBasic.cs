using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WeddingInvite.Data.Migrations
{
    /// <inheritdoc />
    public partial class RenameFreeTierToBasic : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Reconcile the three HasData-seeded rows with the code's new default (AppDbContext.cs).
            migrationBuilder.UpdateData(
                table: "Packages",
                keyColumn: "PackageId",
                keyValue: 1,
                columns: new[] { "PackageCode", "PackageName" },
                values: new object[] { "BASIC", "Basic" });

            migrationBuilder.UpdateData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 1,
                column: "Tier",
                value: "BASIC");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                column: "Tier",
                value: "BASIC");

            // Real data beyond the three seeded rows above: every couple/organizer account, every
            // template (Templates 8/9/10 were seeded via raw InsertData in their own migrations,
            // not HasData, so they never show up in an EF model diff), and — belt and braces — any
            // Package row a super-admin created that still carries the old code. There is no
            // longer a genuinely free tier, so "FREE" is retired outright rather than kept as an
            // alias.
            migrationBuilder.Sql("UPDATE Users SET Tier = 'BASIC' WHERE Tier = 'FREE';");
            migrationBuilder.Sql("UPDATE Templates SET Tier = 'BASIC' WHERE Tier = 'FREE';");
            migrationBuilder.Sql("UPDATE Packages SET PackageCode = 'BASIC', PackageName = 'Basic' WHERE PackageCode = 'FREE';");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("UPDATE Users SET Tier = 'FREE' WHERE Tier = 'BASIC';");
            migrationBuilder.Sql("UPDATE Templates SET Tier = 'FREE' WHERE Tier = 'BASIC';");
            migrationBuilder.Sql("UPDATE Packages SET PackageCode = 'FREE', PackageName = 'Free' WHERE PackageCode = 'BASIC';");
        }
    }
}
