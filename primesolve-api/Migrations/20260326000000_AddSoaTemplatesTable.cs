using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable enable

namespace PrimeSolve.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddSoaTemplatesTable : Migration
    {
        // PrimeSolve platform tenant — admin templates are stored under this tenant
        private static readonly Guid PlatformTenantId =
            Guid.Parse("C63CB975-3DA5-416E-8957-03D3AFB27AFB");

        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SoaTemplates",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    OwnerType = table.Column<int>(type: "int", nullable: false),
                    OwnerId = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Sections = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SoaTemplates", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SoaTemplates_TenantId_OwnerType",
                table: "SoaTemplates",
                columns: new[] { "TenantId", "OwnerType" });

            migrationBuilder.CreateIndex(
                name: "IX_SoaTemplates_OwnerType",
                table: "SoaTemplates",
                column: "OwnerType");

            // Seed the PrimeSolve Default admin template
            migrationBuilder.InsertData(
                table: "SoaTemplates",
                columns: new[] { "Id", "Name", "Description", "OwnerType", "OwnerId", "TenantId", "Sections", "CreatedAt", "UpdatedAt" },
                values: new object[]
                {
                    Guid.Parse("A1B2C3D4-E5F6-7890-ABCD-EF1234567890"),
                    "PrimeSolve Default",
                    "The default SOA template provided by PrimeSolve.",
                    0,       // OwnerType = Admin
                    null,    // OwnerId = null for admin templates
                    PlatformTenantId,
                    null,    // Sections — populated via the UI editor
                    new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                    new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SoaTemplates");
        }
    }
}
