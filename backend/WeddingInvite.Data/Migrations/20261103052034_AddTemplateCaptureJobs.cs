using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WeddingInvite.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddTemplateCaptureJobs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "TemplateCaptureJobs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    TemplateId = table.Column<int>(type: "INTEGER", nullable: false),
                    OwnerEmail = table.Column<string>(type: "TEXT", nullable: false),
                    PublishedDesignHash = table.Column<string>(type: "TEXT", nullable: false),
                    PublishedRevision = table.Column<int>(type: "INTEGER", nullable: true),
                    Status = table.Column<string>(type: "TEXT", nullable: false),
                    LeaseToken = table.Column<string>(type: "TEXT", nullable: true),
                    Error = table.Column<string>(type: "TEXT", nullable: true),
                    Version = table.Column<int>(type: "INTEGER", nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "TEXT", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TemplateCaptureJobs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TemplateCaptureJobs_Templates_TemplateId",
                        column: x => x.TemplateId,
                        principalTable: "Templates",
                        principalColumn: "TemplateId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TemplateCaptureJobs_Status_ExpiresAt",
                table: "TemplateCaptureJobs",
                columns: new[] { "Status", "ExpiresAt" });

            migrationBuilder.CreateIndex(
                name: "IX_TemplateCaptureJobs_TemplateId_OwnerEmail",
                table: "TemplateCaptureJobs",
                columns: new[] { "TemplateId", "OwnerEmail" },
                unique: true,
                filter: "\"Status\" IN ('pending', 'processing', 'ready')");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TemplateCaptureJobs");

        }
    }
}
