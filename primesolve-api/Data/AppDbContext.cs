using Microsoft.EntityFrameworkCore;
using PrimeSolve.Api.Models;

namespace PrimeSolve.Api.Data
{
    public partial class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options) { }

        public DbSet<Document> Documents { get; set; }
        public DbSet<Tenant> Tenants { get; set; }

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

            modelBuilder.Entity<Tenant>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.ToTable("Tenants");
                entity.Property(e => e.LicenceType)
                      .HasColumnName("licence_type")
                      .HasMaxLength(50)
                      .HasDefaultValue("transaction");
                entity.Property(e => e.StripeCustomerId)
                      .HasColumnName("stripe_customer_id")
                      .HasMaxLength(255);
                entity.Property(e => e.StripeSubscriptionId)
                      .HasColumnName("stripe_subscription_id")
                      .HasMaxLength(255);
                entity.Property(e => e.SoaCredits)
                      .HasColumnName("soa_credits")
                      .HasDefaultValue(0);
                entity.Property(e => e.SubscriptionActive)
                      .HasColumnName("subscription_active")
                      .HasDefaultValue(false);
                entity.HasIndex(e => e.StripeCustomerId);
            });
        }
    }
}
