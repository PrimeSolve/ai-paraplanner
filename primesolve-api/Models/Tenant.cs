using System;
using System.ComponentModel.DataAnnotations;

namespace PrimeSolve.Api.Models
{
    public class Tenant
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        [MaxLength(50)]
        public string LicenceType { get; set; } = "transaction";

        [MaxLength(255)]
        public string? StripeCustomerId { get; set; }

        [MaxLength(255)]
        public string? StripeSubscriptionId { get; set; }

        public int SoaCredits { get; set; } = 0;

        public bool SubscriptionActive { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
