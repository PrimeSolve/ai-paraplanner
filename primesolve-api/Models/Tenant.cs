using System;

namespace PrimeSolve.Api.Models
{
    public class Tenant
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public string LicenceType { get; set; } // "full" or "transaction"
        public bool SubscriptionActive { get; set; }
        public int SoaCredits { get; set; }
    }
}
