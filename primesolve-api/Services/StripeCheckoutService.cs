using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Stripe;
using Stripe.Checkout;

namespace PrimeSolve.Api.Services
{
    public class StripeCheckoutService
    {
        private readonly IConfiguration _configuration;

        private static readonly Dictionary<string, (string Mode, int Credits)> PriceTypeMap = new()
        {
            ["FreeTrial"]           = ("payment",      1),
            ["CreditX1"]            = ("payment",      1),
            ["CreditX5"]            = ("payment",      5),
            ["CreditX10"]           = ("payment",     10),
            ["MonthlySubscription"] = ("subscription",  0),
            ["AnnualSubscription"]  = ("subscription",  0),
        };

        public StripeCheckoutService(IConfiguration configuration)
        {
            _configuration = configuration;
            StripeConfiguration.ApiKey = _configuration["Stripe:SecretKey"];
        }

        public async Task<Session> CreateCheckoutSessionAsync(
            string tenantId,
            string priceType,
            string successUrl,
            string cancelUrl)
        {
            if (!PriceTypeMap.TryGetValue(priceType, out var mapping))
                throw new ArgumentException($"Unknown price type: {priceType}");

            var priceId = _configuration[$"StripePrices:{priceType}"]
                ?? throw new InvalidOperationException($"Stripe price not configured for {priceType}");

            var options = new SessionCreateOptions
            {
                Mode = mapping.Mode,
                LineItems = new List<SessionLineItemOptions>
                {
                    new SessionLineItemOptions
                    {
                        Price = priceId,
                        Quantity = 1,
                    },
                },
                Metadata = new Dictionary<string, string>
                {
                    ["tenant_id"] = tenantId,
                    ["price_type"] = priceType,
                    ["credits"] = mapping.Credits.ToString(),
                },
                SuccessUrl = successUrl,
                CancelUrl = cancelUrl,
            };

            var service = new SessionService();
            return await service.CreateAsync(options);
        }

        public static bool IsValidPriceType(string priceType) =>
            PriceTypeMap.ContainsKey(priceType);

        public static int GetCreditsForPriceType(string priceType) =>
            PriceTypeMap.TryGetValue(priceType, out var mapping) ? mapping.Credits : 0;
    }
}
