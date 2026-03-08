using System;

namespace PrimeSolve.Api.Models
{
    public class Tenant
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? PlanName { get; set; }
        public bool SubscriptionActive { get; set; }
        public int SoaCredits { get; set; }
        public string? StripeCustomerId { get; set; }
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
    }
}
