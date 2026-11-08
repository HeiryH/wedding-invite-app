using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WeddingInvite.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddCapturePreviewSnapshot : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PreviewSnapshotJson",
                table: "TemplateCaptureJobs",
                type: "TEXT",
                nullable: true);

        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PreviewSnapshotJson",
                table: "TemplateCaptureJobs");

        }
    }
}
