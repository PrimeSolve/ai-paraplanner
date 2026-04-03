using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PrimeSolve.Api.Migrations
{
    public partial class AddAvatarConfigAndSeenWelcome : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "HasSeenWelcome",
                table: "Clients",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "AvatarConfigs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Role = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    IsEnabled = table.Column<bool>(type: "bit", nullable: false),
                    AvatarId = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    VoiceId = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    VoiceProvider = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    WelcomeScript = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: true),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedDate = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AvatarConfigs", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AvatarConfigs_TenantId_Role",
                table: "AvatarConfigs",
                columns: new[] { "TenantId", "Role" },
                unique: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "AvatarConfigs");

            migrationBuilder.DropColumn(
                name: "HasSeenWelcome",
                table: "Clients");
        }
    }
}
