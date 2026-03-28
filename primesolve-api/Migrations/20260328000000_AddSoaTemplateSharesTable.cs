using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable enable

namespace PrimeSolve.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddSoaTemplateSharesTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SoaTemplateShares",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TemplateId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SharedByTenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SharedToTenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    IsHidden = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SoaTemplateShares", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SoaTemplateShares_SoaTemplates_TemplateId",
                        column: x => x.TemplateId,
                        principalTable: "SoaTemplates",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SOATemplateShares_TemplateId_SharedToTenantId",
                table: "SoaTemplateShares",
                columns: new[] { "TemplateId", "SharedToTenantId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SoaTemplateShares");
        }
    }
}
