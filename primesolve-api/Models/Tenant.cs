using System;
using System.Text.Json.Serialization;

namespace PrimeSolve.Api.Models
{
    public class Tenant
    {
        [JsonPropertyName("id")]
        public Guid Id { get; set; }

        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("planName")]
        public string? PlanName { get; set; }

        [JsonPropertyName("subscriptionActive")]
        public bool SubscriptionActive { get; set; }

        [JsonPropertyName("soaCredits")]
        public int SoaCredits { get; set; }

        [JsonPropertyName("stripeCustomerId")]
        public string? StripeCustomerId { get; set; }

        [JsonPropertyName("createdDate")]
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
    }
}
