using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable enable

namespace PrimeSolve.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddTenantsTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Tenants",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    licence_type = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValue: "transaction"),
                    stripe_customer_id = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    stripe_subscription_id = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    soa_credits = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    subscription_active = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Tenants", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Tenants_stripe_customer_id",
                table: "Tenants",
                column: "stripe_customer_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "Tenants");
        }
    }
}
