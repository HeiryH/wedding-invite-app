using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WeddingInvite.Data.Migrations
{
    /// <inheritdoc />
    public partial class RenameTemplateToTemplates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // AddTemplates migration created the table as "Template" (singular).
            // All subsequent migrations reference "Templates" (plural). This renames it.
            migrationBuilder.Sql("ALTER TABLE \"Template\" RENAME TO \"Templates\";");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("ALTER TABLE \"Templates\" RENAME TO \"Template\";");
        }
    }
}
