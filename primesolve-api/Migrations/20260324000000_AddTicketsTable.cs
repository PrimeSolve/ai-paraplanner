using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable enable

namespace PrimeSolve.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddTicketsTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Tickets",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TicketNumber = table.Column<int>(type: "int", nullable: false),
                    AdviserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AdviceGroupId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Subject = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Category = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Priority = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "Open"),
                    RelatedClientId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    RelatedSOAId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    RelatedFeature = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    AdditionalContext = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Tickets", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Tickets_TenantId_AdviserId",
                table: "Tickets",
                columns: new[] { "TenantId", "AdviserId" });

            migrationBuilder.CreateIndex(
                name: "IX_Tickets_AdviceGroupId",
                table: "Tickets",
                column: "AdviceGroupId");

            migrationBuilder.CreateIndex(
                name: "IX_Tickets_CreatedAt",
                table: "Tickets",
                column: "CreatedAt");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Tickets");
        }
    }
}
