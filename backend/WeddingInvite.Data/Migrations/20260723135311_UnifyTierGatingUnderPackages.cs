using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace WeddingInvite.Data.Migrations
{
    /// <inheritdoc />
    public partial class UnifyTierGatingUnderPackages : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Weddings_Packages_PackageId",
                table: "Weddings");

            migrationBuilder.DropIndex(
                name: "IX_Weddings_PackageId",
                table: "Weddings");

            migrationBuilder.DropColumn(
                name: "PackageId",
                table: "Weddings");

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 1,
                column: "CreatedDate",
                value: new DateTime(2026, 7, 23, 13, 53, 10, 961, DateTimeKind.Utc).AddTicks(3190));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 2,
                column: "CreatedDate",
                value: new DateTime(2026, 7, 23, 13, 53, 10, 961, DateTimeKind.Utc).AddTicks(3290));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 3,
                columns: new[] { "CreatedDate", "IsActive" },
                values: new object[] { new DateTime(2026, 7, 23, 13, 53, 10, 961, DateTimeKind.Utc).AddTicks(3290), true });

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 4,
                column: "CreatedDate",
                value: new DateTime(2026, 7, 23, 13, 53, 10, 961, DateTimeKind.Utc).AddTicks(3300));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 5,
                column: "CreatedDate",
                value: new DateTime(2026, 7, 23, 13, 53, 10, 961, DateTimeKind.Utc).AddTicks(3300));

            migrationBuilder.UpdateData(
                table: "Packages",
                keyColumn: "PackageId",
                keyValue: 1,
                columns: new[] { "PackageCode", "PackageName" },
                values: new object[] { "FREE", "Free" });

            migrationBuilder.InsertData(
                table: "Packages",
                columns: new[] { "PackageId", "CreatedDate", "Description", "IsActive", "PackageCode", "PackageName", "Price", "SortOrder" },
                values: new object[] { 3, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Everything in Premium, plus your own custom domain", true, "PRO", "Pro", 199m, 3 });

            migrationBuilder.UpdateData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 1,
                column: "CreatedDate",
                value: new DateTime(2026, 7, 23, 13, 53, 10, 964, DateTimeKind.Utc).AddTicks(2400));

            migrationBuilder.UpdateData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 2,
                column: "CreatedDate",
                value: new DateTime(2026, 7, 23, 13, 53, 10, 964, DateTimeKind.Utc).AddTicks(2490));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                columns: new[] { "CreatedDate", "PasswordHash" },
                values: new object[] { new DateTime(2026, 7, 23, 13, 53, 11, 149, DateTimeKind.Utc).AddTicks(1640), "$2a$11$yaFp6t.TdiuV4TCGsVQROejZO2lFLnjDc8DsyaLoZWAk1kDeGjDym" });

            migrationBuilder.InsertData(
                table: "PackageFeatures",
                columns: new[] { "PackageFeatureId", "FeatureId", "PackageId" },
                values: new object[,]
                {
                    { 7, 1, 3 },
                    { 8, 3, 3 },
                    { 9, 4, 3 },
                    { 10, 5, 3 },
                    { 11, 6, 3 }
                });

            // Backfill: Custom Domain now requires an explicit per-wedding WeddingFeature toggle
            // (same two-step gate as PHOTO_BOOTH/SEATING), not just tier. Any wedding that already
            // has a domain configured must not silently lose it — grant it the toggle now.
            migrationBuilder.Sql(@"
                INSERT INTO WeddingFeatures (WeddingId, FeatureId, IsEnabled, EnabledDate)
                SELECT w.WeddingId, 3, 1, CURRENT_TIMESTAMP
                FROM Weddings w
                WHERE w.Domain IS NOT NULL
                  AND NOT EXISTS (
                      SELECT 1 FROM WeddingFeatures wf
                      WHERE wf.WeddingId = w.WeddingId AND wf.FeatureId = 3
                  );
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Note: the CUSTOM_DOMAIN WeddingFeature backfill from Up() is intentionally not
            // reversed here — those rows reflect real domains already in use; deleting them on
            // rollback would be a data loss, not a schema revert.
            migrationBuilder.DeleteData(
                table: "PackageFeatures",
                keyColumn: "PackageFeatureId",
                keyValue: 7);

            migrationBuilder.DeleteData(
                table: "PackageFeatures",
                keyColumn: "PackageFeatureId",
                keyValue: 8);

            migrationBuilder.DeleteData(
                table: "PackageFeatures",
                keyColumn: "PackageFeatureId",
                keyValue: 9);

            migrationBuilder.DeleteData(
                table: "PackageFeatures",
                keyColumn: "PackageFeatureId",
                keyValue: 10);

            migrationBuilder.DeleteData(
                table: "PackageFeatures",
                keyColumn: "PackageFeatureId",
                keyValue: 11);

            migrationBuilder.DeleteData(
                table: "Packages",
                keyColumn: "PackageId",
                keyValue: 3);

            migrationBuilder.AddColumn<int>(
                name: "PackageId",
                table: "Weddings",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 1,
                column: "CreatedDate",
                value: new DateTime(2026, 7, 22, 12, 49, 32, 866, DateTimeKind.Utc).AddTicks(4000));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 2,
                column: "CreatedDate",
                value: new DateTime(2026, 7, 22, 12, 49, 32, 866, DateTimeKind.Utc).AddTicks(4090));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 3,
                columns: new[] { "CreatedDate", "IsActive" },
                values: new object[] { new DateTime(2026, 7, 22, 12, 49, 32, 866, DateTimeKind.Utc).AddTicks(4100), false });

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 4,
                column: "CreatedDate",
                value: new DateTime(2026, 7, 22, 12, 49, 32, 866, DateTimeKind.Utc).AddTicks(4100));

            migrationBuilder.UpdateData(
                table: "Features",
                keyColumn: "FeatureId",
                keyValue: 5,
                column: "CreatedDate",
                value: new DateTime(2026, 7, 22, 12, 49, 32, 866, DateTimeKind.Utc).AddTicks(4100));

            migrationBuilder.UpdateData(
                table: "Packages",
                keyColumn: "PackageId",
                keyValue: 1,
                columns: new[] { "PackageCode", "PackageName" },
                values: new object[] { "STARTER", "Starter" });

            migrationBuilder.UpdateData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 1,
                column: "CreatedDate",
                value: new DateTime(2026, 7, 22, 12, 49, 32, 869, DateTimeKind.Utc).AddTicks(3650));

            migrationBuilder.UpdateData(
                table: "Templates",
                keyColumn: "TemplateId",
                keyValue: 2,
                column: "CreatedDate",
                value: new DateTime(2026, 7, 22, 12, 49, 32, 869, DateTimeKind.Utc).AddTicks(3740));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                columns: new[] { "CreatedDate", "PasswordHash" },
                values: new object[] { new DateTime(2026, 7, 22, 12, 49, 33, 54, DateTimeKind.Utc).AddTicks(4200), "$2a$11$TfVUn4htwXn7mlH5qmzMM.rI0KTnSg9VBBWC.hcn1eOCRl9Lxs872" });

            migrationBuilder.CreateIndex(
                name: "IX_Weddings_PackageId",
                table: "Weddings",
                column: "PackageId");

            migrationBuilder.AddForeignKey(
                name: "FK_Weddings_Packages_PackageId",
                table: "Weddings",
                column: "PackageId",
                principalTable: "Packages",
                principalColumn: "PackageId",
                onDelete: ReferentialAction.SetNull);
        }
    }
}
