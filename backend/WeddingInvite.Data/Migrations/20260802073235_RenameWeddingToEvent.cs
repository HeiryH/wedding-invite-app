using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WeddingInvite.Data.Migrations
{
    /// <inheritdoc />
    public partial class RenameWeddingToEvent : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // ── Drop FKs that point at Weddings/WeddingFeatures, so the tables can be renamed ──────
            migrationBuilder.DropForeignKey(
                name: "FK_Guests_Weddings_WeddingId",
                table: "Guests");

            migrationBuilder.DropForeignKey(
                name: "FK_ItineraryItems_Weddings_WeddingId",
                table: "ItineraryItems");

            migrationBuilder.DropForeignKey(
                name: "FK_Photos_Weddings_WeddingId",
                table: "Photos");

            migrationBuilder.DropForeignKey(
                name: "FK_Tables_Weddings_WeddingId",
                table: "Tables");

            migrationBuilder.DropForeignKey(
                name: "FK_TemplateConfigs_Weddings_WeddingId",
                table: "TemplateConfigs");

            migrationBuilder.DropForeignKey(
                name: "FK_Users_Weddings_WeddingId",
                table: "Users");

            migrationBuilder.DropForeignKey(
                name: "FK_Wishes_Weddings_WeddingId",
                table: "Wishes");

            // ── Weddings → Events: rename table + columns in place (no data loss) ──────────────────
            migrationBuilder.RenameTable(
                name: "Weddings",
                newName: "Events");

            migrationBuilder.RenameColumn(
                name: "WeddingId",
                table: "Events",
                newName: "EventId");

            migrationBuilder.RenameColumn(
                name: "CoupleName",
                table: "Events",
                newName: "Slug");

            migrationBuilder.RenameColumn(
                name: "BrideName",
                table: "Events",
                newName: "Name1");

            migrationBuilder.RenameColumn(
                name: "GroomName",
                table: "Events",
                newName: "Name2");

            migrationBuilder.RenameColumn(
                name: "WeddingDate",
                table: "Events",
                newName: "EventDate");

            migrationBuilder.RenameIndex(
                name: "IX_Weddings_CoupleName",
                table: "Events",
                newName: "IX_Events_Slug");

            migrationBuilder.RenameIndex(
                name: "IX_Weddings_CreatedByUserId",
                table: "Events",
                newName: "IX_Events_CreatedByUserId");

            migrationBuilder.RenameIndex(
                name: "IX_Weddings_Domain",
                table: "Events",
                newName: "IX_Events_Domain");

            migrationBuilder.RenameIndex(
                name: "IX_Weddings_TemplateId",
                table: "Events",
                newName: "IX_Events_TemplateId");

            // Name1/Name2 were required (BrideName/GroomName); now optional — PARTY only needs
            // Name1, CEREMONY needs neither.
            migrationBuilder.AlterColumn<string>(
                name: "Name1",
                table: "Events",
                type: "TEXT",
                maxLength: 100,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "TEXT",
                oldMaxLength: 100);

            migrationBuilder.AlterColumn<string>(
                name: "Name2",
                table: "Events",
                type: "TEXT",
                maxLength: 100,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "TEXT",
                oldMaxLength: 100);

            // New columns — every existing row backfills to WEDDING (its only prior meaning) with no title.
            migrationBuilder.AddColumn<string>(
                name: "EventType",
                table: "Events",
                type: "TEXT",
                maxLength: 20,
                nullable: false,
                defaultValue: "WEDDING");

            migrationBuilder.AddColumn<string>(
                name: "EventTitle",
                table: "Events",
                type: "TEXT",
                maxLength: 200,
                nullable: true);

            // ── WeddingFeatures → EventFeatures: rename table + columns in place ────────────────────
            migrationBuilder.RenameTable(
                name: "WeddingFeatures",
                newName: "EventFeatures");

            migrationBuilder.RenameColumn(
                name: "WeddingFeatureId",
                table: "EventFeatures",
                newName: "EventFeatureId");

            migrationBuilder.RenameColumn(
                name: "WeddingId",
                table: "EventFeatures",
                newName: "EventId");

            migrationBuilder.RenameIndex(
                name: "IX_WeddingFeatures_FeatureId",
                table: "EventFeatures",
                newName: "IX_EventFeatures_FeatureId");

            migrationBuilder.RenameIndex(
                name: "IX_WeddingFeatures_WeddingId_FeatureId",
                table: "EventFeatures",
                newName: "IX_EventFeatures_EventId_FeatureId");

            // ── Guests.BrideOrGroomSide → GuestSide: rename column in place, now optional (only
            //    meaningful for WEDDING events) ───────────────────────────────────────────────────
            migrationBuilder.RenameColumn(
                name: "BrideOrGroomSide",
                table: "Guests",
                newName: "GuestSide");

            migrationBuilder.AlterColumn<string>(
                name: "GuestSide",
                table: "Guests",
                type: "TEXT",
                maxLength: 20,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "TEXT",
                oldMaxLength: 20);

            // ── Every other WeddingId FK column → EventId (unchanged from the scaffolded output —
            //    these were already correctly generated as in-place renames) ───────────────────────
            migrationBuilder.RenameColumn(
                name: "WeddingId",
                table: "Wishes",
                newName: "EventId");

            migrationBuilder.RenameIndex(
                name: "IX_Wishes_WeddingId",
                table: "Wishes",
                newName: "IX_Wishes_EventId");

            migrationBuilder.RenameColumn(
                name: "WeddingId",
                table: "Users",
                newName: "EventId");

            migrationBuilder.RenameIndex(
                name: "IX_Users_WeddingId",
                table: "Users",
                newName: "IX_Users_EventId");

            migrationBuilder.RenameColumn(
                name: "WeddingId",
                table: "TemplateConfigs",
                newName: "EventId");

            migrationBuilder.RenameColumn(
                name: "WeddingTemplateConfigId",
                table: "TemplateConfigs",
                newName: "EventTemplateConfigId");

            migrationBuilder.RenameIndex(
                name: "IX_TemplateConfigs_WeddingId_ConfigKey",
                table: "TemplateConfigs",
                newName: "IX_TemplateConfigs_EventId_ConfigKey");

            migrationBuilder.RenameColumn(
                name: "WeddingId",
                table: "Tables",
                newName: "EventId");

            migrationBuilder.RenameIndex(
                name: "IX_Tables_WeddingId",
                table: "Tables",
                newName: "IX_Tables_EventId");

            migrationBuilder.RenameColumn(
                name: "WeddingId",
                table: "Photos",
                newName: "EventId");

            migrationBuilder.RenameIndex(
                name: "IX_Photos_WeddingId",
                table: "Photos",
                newName: "IX_Photos_EventId");

            migrationBuilder.RenameColumn(
                name: "WeddingId",
                table: "ItineraryItems",
                newName: "EventId");

            migrationBuilder.RenameIndex(
                name: "IX_ItineraryItems_WeddingId",
                table: "ItineraryItems",
                newName: "IX_ItineraryItems_EventId");

            migrationBuilder.RenameColumn(
                name: "WeddingId",
                table: "Guests",
                newName: "EventId");

            migrationBuilder.RenameIndex(
                name: "IX_Guests_WeddingId",
                table: "Guests",
                newName: "IX_Guests_EventId");

            // ── Re-add the FKs, now pointing at Events ──────────────────────────────────────────────
            migrationBuilder.AddForeignKey(
                name: "FK_Guests_Events_EventId",
                table: "Guests",
                column: "EventId",
                principalTable: "Events",
                principalColumn: "EventId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ItineraryItems_Events_EventId",
                table: "ItineraryItems",
                column: "EventId",
                principalTable: "Events",
                principalColumn: "EventId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Photos_Events_EventId",
                table: "Photos",
                column: "EventId",
                principalTable: "Events",
                principalColumn: "EventId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Tables_Events_EventId",
                table: "Tables",
                column: "EventId",
                principalTable: "Events",
                principalColumn: "EventId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_TemplateConfigs_Events_EventId",
                table: "TemplateConfigs",
                column: "EventId",
                principalTable: "Events",
                principalColumn: "EventId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Users_Events_EventId",
                table: "Users",
                column: "EventId",
                principalTable: "Events",
                principalColumn: "EventId",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Wishes_Events_EventId",
                table: "Wishes",
                column: "EventId",
                principalTable: "Events",
                principalColumn: "EventId",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Guests_Events_EventId",
                table: "Guests");

            migrationBuilder.DropForeignKey(
                name: "FK_ItineraryItems_Events_EventId",
                table: "ItineraryItems");

            migrationBuilder.DropForeignKey(
                name: "FK_Photos_Events_EventId",
                table: "Photos");

            migrationBuilder.DropForeignKey(
                name: "FK_Tables_Events_EventId",
                table: "Tables");

            migrationBuilder.DropForeignKey(
                name: "FK_TemplateConfigs_Events_EventId",
                table: "TemplateConfigs");

            migrationBuilder.DropForeignKey(
                name: "FK_Users_Events_EventId",
                table: "Users");

            migrationBuilder.DropForeignKey(
                name: "FK_Wishes_Events_EventId",
                table: "Wishes");

            migrationBuilder.RenameColumn(
                name: "EventId",
                table: "Wishes",
                newName: "WeddingId");

            migrationBuilder.RenameIndex(
                name: "IX_Wishes_EventId",
                table: "Wishes",
                newName: "IX_Wishes_WeddingId");

            migrationBuilder.RenameColumn(
                name: "EventId",
                table: "Users",
                newName: "WeddingId");

            migrationBuilder.RenameIndex(
                name: "IX_Users_EventId",
                table: "Users",
                newName: "IX_Users_WeddingId");

            migrationBuilder.RenameColumn(
                name: "EventId",
                table: "TemplateConfigs",
                newName: "WeddingId");

            migrationBuilder.RenameColumn(
                name: "EventTemplateConfigId",
                table: "TemplateConfigs",
                newName: "WeddingTemplateConfigId");

            migrationBuilder.RenameIndex(
                name: "IX_TemplateConfigs_EventId_ConfigKey",
                table: "TemplateConfigs",
                newName: "IX_TemplateConfigs_WeddingId_ConfigKey");

            migrationBuilder.RenameColumn(
                name: "EventId",
                table: "Tables",
                newName: "WeddingId");

            migrationBuilder.RenameIndex(
                name: "IX_Tables_EventId",
                table: "Tables",
                newName: "IX_Tables_WeddingId");

            migrationBuilder.RenameColumn(
                name: "EventId",
                table: "Photos",
                newName: "WeddingId");

            migrationBuilder.RenameIndex(
                name: "IX_Photos_EventId",
                table: "Photos",
                newName: "IX_Photos_WeddingId");

            migrationBuilder.RenameColumn(
                name: "EventId",
                table: "ItineraryItems",
                newName: "WeddingId");

            migrationBuilder.RenameIndex(
                name: "IX_ItineraryItems_EventId",
                table: "ItineraryItems",
                newName: "IX_ItineraryItems_WeddingId");

            migrationBuilder.RenameColumn(
                name: "EventId",
                table: "Guests",
                newName: "WeddingId");

            migrationBuilder.RenameIndex(
                name: "IX_Guests_EventId",
                table: "Guests",
                newName: "IX_Guests_WeddingId");

            // ── Guests.GuestSide → BrideOrGroomSide ─────────────────────────────────────────────────
            migrationBuilder.AlterColumn<string>(
                name: "GuestSide",
                table: "Guests",
                type: "TEXT",
                maxLength: 20,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "TEXT",
                oldMaxLength: 20,
                oldNullable: true);

            migrationBuilder.RenameColumn(
                name: "GuestSide",
                table: "Guests",
                newName: "BrideOrGroomSide");

            // ── EventFeatures → WeddingFeatures ─────────────────────────────────────────────────────
            migrationBuilder.RenameIndex(
                name: "IX_EventFeatures_FeatureId",
                table: "EventFeatures",
                newName: "IX_WeddingFeatures_FeatureId");

            migrationBuilder.RenameIndex(
                name: "IX_EventFeatures_EventId_FeatureId",
                table: "EventFeatures",
                newName: "IX_WeddingFeatures_WeddingId_FeatureId");

            migrationBuilder.RenameColumn(
                name: "EventId",
                table: "EventFeatures",
                newName: "WeddingId");

            migrationBuilder.RenameColumn(
                name: "EventFeatureId",
                table: "EventFeatures",
                newName: "WeddingFeatureId");

            migrationBuilder.RenameTable(
                name: "EventFeatures",
                newName: "WeddingFeatures");

            // ── Events → Weddings ────────────────────────────────────────────────────────────────────
            migrationBuilder.DropColumn(
                name: "EventTitle",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "EventType",
                table: "Events");

            migrationBuilder.AlterColumn<string>(
                name: "Name2",
                table: "Events",
                type: "TEXT",
                maxLength: 100,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "TEXT",
                oldMaxLength: 100,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Name1",
                table: "Events",
                type: "TEXT",
                maxLength: 100,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "TEXT",
                oldMaxLength: 100,
                oldNullable: true);

            migrationBuilder.RenameIndex(
                name: "IX_Events_Slug",
                table: "Events",
                newName: "IX_Weddings_CoupleName");

            migrationBuilder.RenameIndex(
                name: "IX_Events_CreatedByUserId",
                table: "Events",
                newName: "IX_Weddings_CreatedByUserId");

            migrationBuilder.RenameIndex(
                name: "IX_Events_Domain",
                table: "Events",
                newName: "IX_Weddings_Domain");

            migrationBuilder.RenameIndex(
                name: "IX_Events_TemplateId",
                table: "Events",
                newName: "IX_Weddings_TemplateId");

            migrationBuilder.RenameColumn(
                name: "EventDate",
                table: "Events",
                newName: "WeddingDate");

            migrationBuilder.RenameColumn(
                name: "Name2",
                table: "Events",
                newName: "GroomName");

            migrationBuilder.RenameColumn(
                name: "Name1",
                table: "Events",
                newName: "BrideName");

            migrationBuilder.RenameColumn(
                name: "Slug",
                table: "Events",
                newName: "CoupleName");

            migrationBuilder.RenameColumn(
                name: "EventId",
                table: "Events",
                newName: "WeddingId");

            migrationBuilder.RenameTable(
                name: "Events",
                newName: "Weddings");

            migrationBuilder.AddForeignKey(
                name: "FK_Guests_Weddings_WeddingId",
                table: "Guests",
                column: "WeddingId",
                principalTable: "Weddings",
                principalColumn: "WeddingId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ItineraryItems_Weddings_WeddingId",
                table: "ItineraryItems",
                column: "WeddingId",
                principalTable: "Weddings",
                principalColumn: "WeddingId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Photos_Weddings_WeddingId",
                table: "Photos",
                column: "WeddingId",
                principalTable: "Weddings",
                principalColumn: "WeddingId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Tables_Weddings_WeddingId",
                table: "Tables",
                column: "WeddingId",
                principalTable: "Weddings",
                principalColumn: "WeddingId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_TemplateConfigs_Weddings_WeddingId",
                table: "TemplateConfigs",
                column: "WeddingId",
                principalTable: "Weddings",
                principalColumn: "WeddingId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Users_Weddings_WeddingId",
                table: "Users",
                column: "WeddingId",
                principalTable: "Weddings",
                principalColumn: "WeddingId",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Wishes_Weddings_WeddingId",
                table: "Wishes",
                column: "WeddingId",
                principalTable: "Weddings",
                principalColumn: "WeddingId",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
