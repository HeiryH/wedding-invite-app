using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WeddingInvite.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddRoseHorizonTemplate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 1,
                column: "CreatedDate",
                value: new DateTime(2026, 9, 10, 1, 4, 8, 205, DateTimeKind.Utc).AddTicks(4780));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 2,
                column: "CreatedDate",
                value: new DateTime(2026, 9, 10, 1, 4, 8, 205, DateTimeKind.Utc).AddTicks(4870));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 3,
                column: "CreatedDate",
                value: new DateTime(2026, 9, 10, 1, 4, 8, 205, DateTimeKind.Utc).AddTicks(4870));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 4,
                column: "CreatedDate",
                value: new DateTime(2026, 9, 10, 1, 4, 8, 205, DateTimeKind.Utc).AddTicks(4870));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 5,
                column: "CreatedDate",
                value: new DateTime(2026, 9, 10, 1, 4, 8, 205, DateTimeKind.Utc).AddTicks(4870));

            migrationBuilder.UpdateData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 1,
                column: "CreatedDate",
                value: new DateTime(2026, 9, 10, 1, 4, 8, 206, DateTimeKind.Utc).AddTicks(8950));

            migrationBuilder.UpdateData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 2,
                column: "CreatedDate",
                value: new DateTime(2026, 9, 10, 1, 4, 8, 206, DateTimeKind.Utc).AddTicks(9030));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                columns: new[] { "CreatedDate", "PasswordHash" },
                values: new object[] { new DateTime(2026, 9, 10, 1, 4, 8, 373, DateTimeKind.Utc).AddTicks(4970), "$2a$11$5cH57FN2smrY9HS92UmCeOgMrH.y3HrSuf2vxBtEFnqslclYg/IUO" });

            // WEDDING, Classic family (flow + overlay, DOM/flow -- NOT the T7/T10 Stage
            // compositor), PRO tier -- see Template11-rosehorizon/. Raw InsertData rather than
            // AppDbContext HasData, matching Templates 5/8/9/10: keeps the model snapshot
            // untouched. Tier/EventTypes/ComponentPath sourced verbatim from
            // docs/rose-horizon-design-brief.md's four answers, per migration-task-body.md.
            migrationBuilder.InsertData(
                table: "Templates",
                columns: new[] { "TemplateId", "ComponentPath", "CreatedDate", "Description", "EventTypes", "IsActive", "IsPremium", "PrimaryColor", "SecondaryColor", "SortOrder", "TemplateCode", "TemplateName", "ThumbnailUrl", "Tier" },
                values: new object[] { 11, "Template11", new DateTime(2026, 9, 10, 0, 0, 0, 0, DateTimeKind.Utc), "Soft gouache wedding illustration with a mirror-stacked flowing sky background and rose-framed sections -- Classic family (flow + overlay), authored through the invite pipeline", "WEDDING", true, true, "#7CA3C0", "#FCB887", 11, "rose-horizon", "Rose Horizon", "", "PRO" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 11);

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 1,
                column: "CreatedDate",
                value: new DateTime(2026, 9, 7, 16, 2, 54, 581, DateTimeKind.Utc).AddTicks(2690));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 2,
                column: "CreatedDate",
                value: new DateTime(2026, 9, 7, 16, 2, 54, 581, DateTimeKind.Utc).AddTicks(2780));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 3,
                column: "CreatedDate",
                value: new DateTime(2026, 9, 7, 16, 2, 54, 581, DateTimeKind.Utc).AddTicks(2790));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 4,
                column: "CreatedDate",
                value: new DateTime(2026, 9, 7, 16, 2, 54, 581, DateTimeKind.Utc).AddTicks(2790));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 5,
                column: "CreatedDate",
                value: new DateTime(2026, 9, 7, 16, 2, 54, 581, DateTimeKind.Utc).AddTicks(2810));

            migrationBuilder.UpdateData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 1,
                column: "CreatedDate",
                value: new DateTime(2026, 9, 7, 16, 2, 54, 582, DateTimeKind.Utc).AddTicks(7680));

            migrationBuilder.UpdateData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 2,
                column: "CreatedDate",
                value: new DateTime(2026, 9, 7, 16, 2, 54, 582, DateTimeKind.Utc).AddTicks(7780));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                columns: new[] { "CreatedDate", "PasswordHash" },
                values: new object[] { new DateTime(2026, 9, 7, 16, 2, 54, 766, DateTimeKind.Utc).AddTicks(6950), "$2a$11$VQUPnq38o9wuPtHL8ng7Qu4uRn0eN/iM/sb1zH/75SuFJFJxbbl.e" });
        }
    }
}
