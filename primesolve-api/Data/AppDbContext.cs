using Microsoft.EntityFrameworkCore;
using PrimeSolve.Api.Models;

namespace PrimeSolve.Api.Data
{
    public partial class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options) { }

        public DbSet<Document> Documents { get; set; }
        public DbSet<Client> Clients { get; set; }
        public DbSet<Tenant> Tenants { get; set; }
        public DbSet<AdviceRecord> AdviceRecords { get; set; }
        public DbSet<Company> Companies { get; set; }
        public DbSet<CompanyShareholder> CompanyShareholders { get; set; }
        public DbSet<Ticket> Tickets { get; set; }
        public DbSet<SoaTemplate> SoaTemplates { get; set; }
        public DbSet<AvatarConfig> AvatarConfigs { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Document>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => new { e.TenantId, e.ClientId });
                entity.Property(e => e.Status)
                      .HasConversion<string>()
                      .HasMaxLength(20);
            });

            modelBuilder.Entity<Client>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => new { e.TenantId, e.AdviserId });
                entity.HasIndex(e => e.Email);
            });

            modelBuilder.Entity<Tenant>(entity =>
            {
                entity.HasKey(e => e.Id);
            });

            modelBuilder.Entity<AdviceRecord>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => new { e.TenantId, e.ClientId });
                entity.HasIndex(e => e.CreatedAt);
                entity.Property(e => e.FactFindSnapshot).HasColumnType("nvarchar(max)");
                entity.Property(e => e.AdviceModelSnapshot).HasColumnType("nvarchar(max)");
                entity.Property(e => e.ProjectionSnapshot).HasColumnType("nvarchar(max)");
            });

            modelBuilder.Entity<Company>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => new { e.TenantId, e.ClientId });
                entity.Property(e => e.CompanyName).HasMaxLength(255);
                entity.Property(e => e.TaxRate).HasColumnType("decimal(18,4)");
                entity.Property(e => e.FrankingBalance).HasColumnType("decimal(18,2)");
                entity.HasMany(e => e.Shareholders)
                      .WithOne(s => s.Company)
                      .HasForeignKey(s => s.CompanyId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<CompanyShareholder>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => new { e.TenantId, e.CompanyId });
                entity.Property(e => e.SharePercentage).HasColumnType("decimal(18,4)");
            });

            modelBuilder.Entity<Ticket>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => new { e.TenantId, e.AdviserId });
                entity.HasIndex(e => e.AdviceGroupId);
                entity.HasIndex(e => e.CreatedAt);
                entity.Property(e => e.Status).HasDefaultValue("Open");
                entity.Property(e => e.Description).HasColumnType("nvarchar(max)");
                entity.Property(e => e.AdditionalContext).HasColumnType("nvarchar(max)");
            });

            modelBuilder.Entity<SoaTemplate>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => new { e.TenantId, e.OwnerType });
                entity.HasIndex(e => e.OwnerType);
                entity.Property(e => e.Sections).HasColumnType("nvarchar(max)");
            });

            modelBuilder.Entity<AvatarConfig>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => new { e.TenantId, e.Role }).IsUnique();
            });
        }
    }
}
