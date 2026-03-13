using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace PrimeSolve.Api.Models
{
    public class Company
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public Guid TenantId { get; set; }

        [Required]
        public Guid ClientId { get; set; }

        [Required]
        [MaxLength(255)]
        public string CompanyName { get; set; } = string.Empty;

        public decimal? TaxRate { get; set; }

        public decimal? FrankingBalance { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public Tenant? Tenant { get; set; }

        public ICollection<CompanyShareholder> Shareholders { get; set; } = new List<CompanyShareholder>();
    }
}
