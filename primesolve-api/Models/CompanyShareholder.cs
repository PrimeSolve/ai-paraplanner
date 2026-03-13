using System;
using System.ComponentModel.DataAnnotations;

namespace PrimeSolve.Api.Models
{
    public class CompanyShareholder
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public Guid CompanyId { get; set; }

        [Required]
        public Guid TenantId { get; set; }

        public Guid? ShareholderClientId { get; set; }

        public Guid? ShareholderEntityId { get; set; }

        public decimal? SharePercentage { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public Company? Company { get; set; }
        public Tenant? Tenant { get; set; }
    }
}
