using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using PrimeSolve.Api.Data;
using PrimeSolve.Api.Services;
using Stripe;
using Stripe.Checkout;

namespace PrimeSolve.Api.Controllers
{
    [ApiController]
    [Route("api/v1/billing")]
    public class BillingController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly StripeService _stripe;
        private readonly IConfiguration _configuration;
        private readonly ILogger<BillingController> _logger;

        public BillingController(
            AppDbContext db,
            StripeService stripe,
            IConfiguration configuration,
            ILogger<BillingController> logger)
        {
            _db = db;
            _stripe = stripe;
            _configuration = configuration;
            _logger = logger;
        }

        /// <summary>
        /// POST /billing/checkout — creates a Stripe Checkout session for
        /// purchasing credits or a subscription, returns the checkout URL.
        /// </summary>
        [HttpPost("checkout")]
        [Authorize]
        public async Task<IActionResult> Checkout([FromBody] CheckoutRequest request)
        {
            var tenantId = GetTenantId();
            if (tenantId == Guid.Empty)
                return Unauthorized(new { error = "Tenant ID not found in token." });

            var tenant = await _db.Tenants.FindAsync(tenantId);
            if (tenant == null)
                return NotFound(new { error = "Tenant not found." });

            var mode = request.Mode?.ToLowerInvariant() switch
            {
                "subscription" => "subscription",
                _ => "payment"
            };

            var checkoutUrl = await _stripe.CreateCheckoutSessionAsync(
                tenantId.ToString(),
                mode,
                request.PriceId,
                request.Quantity > 0 ? request.Quantity : 1,
                request.SuccessUrl,
                request.CancelUrl,
                tenant.StripeCustomerId);

            return Ok(new { url = checkoutUrl });
        }

        /// <summary>
        /// POST /billing/webhook — handles Stripe webhooks:
        ///   checkout.session.completed → adds credits or activates subscription
        ///   customer.subscription.deleted → deactivates subscription
        /// </summary>
        [HttpPost("webhook")]
        [AllowAnonymous]
        public async Task<IActionResult> Webhook()
        {
            var json = await new StreamReader(HttpContext.Request.Body).ReadToEndAsync();
            var signature = Request.Headers["Stripe-Signature"].ToString();
            var webhookSecret = _configuration["Stripe:WebhookSecret"]
                                ?? Environment.GetEnvironmentVariable("Stripe__WebhookSecret")
                                ?? "";

            Event stripeEvent;
            try
            {
                stripeEvent = _stripe.ConstructWebhookEvent(json, signature, webhookSecret);
            }
            catch (StripeException ex)
            {
                _logger.LogWarning("Stripe webhook signature verification failed: {Message}", ex.Message);
                return BadRequest(new { error = "Invalid signature." });
            }

            switch (stripeEvent.Type)
            {
                case EventTypes.CheckoutSessionCompleted:
                    await HandleCheckoutCompleted(stripeEvent);
                    break;

                case EventTypes.CustomerSubscriptionDeleted:
                    await HandleSubscriptionDeleted(stripeEvent);
                    break;

                default:
                    _logger.LogInformation("Unhandled Stripe event type: {Type}", stripeEvent.Type);
                    break;
            }

            return Ok();
        }

        /// <summary>
        /// GET /billing/status — returns current tenant billing status.
        /// </summary>
        [HttpGet("status")]
        [Authorize]
        public async Task<IActionResult> Status()
        {
            var tenantId = GetTenantId();
            if (tenantId == Guid.Empty)
                return Unauthorized(new { error = "Tenant ID not found in token." });

            var tenant = await _db.Tenants.FindAsync(tenantId);
            if (tenant == null)
                return NotFound(new { error = "Tenant not found." });

            return Ok(new
            {
                licenceType = tenant.LicenceType,
                soaCredits = tenant.SoaCredits,
                subscriptionActive = tenant.SubscriptionActive
            });
        }

        private async Task HandleCheckoutCompleted(Event stripeEvent)
        {
            var session = stripeEvent.Data.Object as Session;
            if (session == null) return;

            var fullSession = await _stripe.GetCheckoutSessionAsync(session.Id);

            if (!fullSession.Metadata.TryGetValue("tenant_id", out var tenantIdStr) ||
                !Guid.TryParse(tenantIdStr, out var tenantId))
            {
                _logger.LogWarning("Checkout session {SessionId} missing tenant_id metadata", session.Id);
                return;
            }

            var tenant = await _db.Tenants.FindAsync(tenantId);
            if (tenant == null)
            {
                _logger.LogWarning("Tenant {TenantId} not found for checkout session {SessionId}", tenantId, session.Id);
                return;
            }

            // Save the Stripe customer ID if we don't have one yet
            if (string.IsNullOrEmpty(tenant.StripeCustomerId) && !string.IsNullOrEmpty(fullSession.CustomerId))
            {
                tenant.StripeCustomerId = fullSession.CustomerId;
            }

            if (fullSession.Mode == "subscription")
            {
                // Activate subscription
                tenant.SubscriptionActive = true;
                tenant.StripeSubscriptionId = fullSession.SubscriptionId;

                // Set licence type based on metadata or default to starter
                if (fullSession.Metadata.TryGetValue("licence_type", out var licenceType))
                {
                    tenant.LicenceType = licenceType;
                }
                else
                {
                    tenant.LicenceType = "starter";
                }

                _logger.LogInformation(
                    "Subscription activated for tenant {TenantId}, subscription {SubscriptionId}",
                    tenantId, tenant.StripeSubscriptionId);
            }
            else
            {
                // One-time payment — add SOA credits
                var creditsToAdd = (int)(fullSession.AmountTotal ?? 0) / 100;

                // Check metadata for explicit credit count
                if (fullSession.Metadata.TryGetValue("credits", out var creditsStr) &&
                    int.TryParse(creditsStr, out var explicitCredits))
                {
                    creditsToAdd = explicitCredits;
                }

                tenant.SoaCredits += creditsToAdd;

                _logger.LogInformation(
                    "Added {Credits} SOA credits to tenant {TenantId} (total: {Total})",
                    creditsToAdd, tenantId, tenant.SoaCredits);
            }

            await _db.SaveChangesAsync();
        }

        private async Task HandleSubscriptionDeleted(Event stripeEvent)
        {
            var subscription = stripeEvent.Data.Object as Subscription;
            if (subscription == null) return;

            var tenant = await _db.Tenants
                .FirstOrDefaultAsync(t => t.StripeSubscriptionId == subscription.Id);

            if (tenant == null)
            {
                _logger.LogWarning("No tenant found for deleted subscription {SubscriptionId}", subscription.Id);
                return;
            }

            tenant.SubscriptionActive = false;
            tenant.LicenceType = "transaction";
            await _db.SaveChangesAsync();

            _logger.LogInformation(
                "Subscription deactivated for tenant {TenantId}, subscription {SubscriptionId}",
                tenant.Id, subscription.Id);
        }

        private Guid GetTenantId()
        {
            var claim = User.FindFirst("tenant_id") ?? User.FindFirst("tenantId");
            return claim != null && Guid.TryParse(claim.Value, out var id) ? id : Guid.Empty;
        }
    }

    public class CheckoutRequest
    {
        public string PriceId { get; set; } = string.Empty;
        public string? Mode { get; set; }
        public int Quantity { get; set; } = 1;
        public string SuccessUrl { get; set; } = string.Empty;
        public string CancelUrl { get; set; } = string.Empty;
    }
}
