using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WeddingInvite.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddTemplateStudio : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "TemplateStudioDrafts",
                columns: table => new
                {
                    TemplateId = table.Column<int>(type: "INTEGER", nullable: false),
                    ConfigJson = table.Column<string>(type: "TEXT", nullable: false),
                    SampleJson = table.Column<string>(type: "TEXT", nullable: false),
                    Version = table.Column<int>(type: "INTEGER", nullable: false),
                    PublishedFingerprint = table.Column<string>(type: "TEXT", nullable: false),
                    UpdatedDate = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TemplateStudioDrafts", x => x.TemplateId);
                    table.ForeignKey(
                        name: "FK_TemplateStudioDrafts_Templates_TemplateId",
                        column: x => x.TemplateId,
                        principalTable: "Templates",
                        principalColumn: "TemplateId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TemplateStudioRevisions",
                columns: table => new
                {
                    TemplateStudioRevisionId = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    TemplateId = table.Column<int>(type: "INTEGER", nullable: false),
                    Revision = table.Column<int>(type: "INTEGER", nullable: false),
                    ConfigJson = table.Column<string>(type: "TEXT", nullable: false),
                    PublishedDate = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TemplateStudioRevisions", x => x.TemplateStudioRevisionId);
                    table.ForeignKey(
                        name: "FK_TemplateStudioRevisions_Templates_TemplateId",
                        column: x => x.TemplateId,
                        principalTable: "Templates",
                        principalColumn: "TemplateId",
                        onDelete: ReferentialAction.Cascade);
                });









            migrationBuilder.CreateIndex(
                name: "IX_TemplateStudioRevisions_TemplateId_Revision",
                table: "TemplateStudioRevisions",
                columns: new[] { "TemplateId", "Revision" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TemplateStudioDrafts");

            migrationBuilder.DropTable(
                name: "TemplateStudioRevisions");








        }
    }
}
