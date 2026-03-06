using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Stripe;
using Stripe.Checkout;

namespace PrimeSolve.Api.Services
{
    public class StripeService
    {
        private readonly ILogger<StripeService> _logger;
        private readonly string _secretKey;

        public StripeService(IConfiguration configuration, ILogger<StripeService> logger)
        {
            _logger = logger;
            _secretKey = configuration["Stripe:SecretKey"]
                         ?? Environment.GetEnvironmentVariable("Stripe__SecretKey")
                         ?? throw new InvalidOperationException("Stripe secret key not configured.");
            StripeConfiguration.ApiKey = _secretKey;
        }

        /// <summary>
        /// Creates a Stripe Checkout session for purchasing credits or a subscription.
        /// </summary>
        public async Task<string> CreateCheckoutSessionAsync(
            string tenantId,
            string mode,
            string priceId,
            int quantity,
            string successUrl,
            string cancelUrl,
            string? stripeCustomerId)
        {
            var options = new SessionCreateOptions
            {
                SuccessUrl = successUrl,
                CancelUrl = cancelUrl,
                Mode = mode,
                LineItems = new List<SessionLineItemOptions>
                {
                    new SessionLineItemOptions
                    {
                        Price = priceId,
                        Quantity = quantity,
                    }
                },
                Metadata = new Dictionary<string, string>
                {
                    { "tenant_id", tenantId },
                    { "mode", mode }
                }
            };

            if (!string.IsNullOrEmpty(stripeCustomerId))
            {
                options.Customer = stripeCustomerId;
            }
            else
            {
                options.CustomerCreation = mode == "payment" ? "always" : null;
            }

            var service = new SessionService();
            var session = await service.CreateAsync(options);

            _logger.LogInformation(
                "Created Stripe checkout session {SessionId} for tenant {TenantId} in mode {Mode}",
                session.Id, tenantId, mode);

            return session.Url;
        }

        /// <summary>
        /// Retrieves a Stripe Checkout session by ID.
        /// </summary>
        public async Task<Session> GetCheckoutSessionAsync(string sessionId)
        {
            var service = new SessionService();
            return await service.GetAsync(sessionId, new SessionGetOptions
            {
                Expand = new List<string> { "subscription", "customer" }
            });
        }

        /// <summary>
        /// Constructs a Stripe event from the webhook payload and signature.
        /// </summary>
        public Event ConstructWebhookEvent(string json, string signature, string webhookSecret)
        {
            return EventUtility.ConstructEvent(json, signature, webhookSecret);
        }
    }
}
