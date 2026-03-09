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
        public DbSet<AdviceRequest> AdviceRequests { get; set; }

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

            modelBuilder.Entity<AdviceRequest>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => new { e.TenantId, e.ClientId });
            });
        }
    }
}
