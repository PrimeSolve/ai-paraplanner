using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using PrimeSolve.Api.Data;
using PrimeSolve.Api.Models;
using PrimeSolve.Api.Services;

namespace PrimeSolve.Api.Controllers
{
    [ApiController]
    [Route("api/v1/billing")]
    [Authorize]
    public class BillingController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly StripeCheckoutService _stripeCheckout;
        private readonly IConfiguration _configuration;

        // Maps frontend priceType values to PriceTypeMap keys
        private static readonly Dictionary<string, string> FrontendPriceTypeAliases = new()
        {
            ["credits_1"]  = "CreditX1",
            ["credits_5"]  = "CreditX5",
            ["credits_10"] = "CreditX10",
            ["free_trial"] = "FreeTrial",
            ["monthly"]    = "MonthlySubscription",
            ["annual"]     = "AnnualSubscription",
        };

        public BillingController(
            AppDbContext db,
            StripeCheckoutService stripeCheckout,
            IConfiguration configuration)
        {
            _db = db;
            _stripeCheckout = stripeCheckout;
            _configuration = configuration;
        }

        /// <summary>
        /// GET /api/v1/billing/status — returns billing status for the current tenant.
        /// </summary>
        [HttpGet("status")]
        public async Task<IActionResult> GetStatus()
        {
            var tenantId = GetTenantId();
            if (tenantId == Guid.Empty)
                return Unauthorized(new { error = "Tenant ID not found in token." });

            var tenant = await _db.Tenants.FirstOrDefaultAsync(t => t.Id == tenantId);
            if (tenant == null)
                return NotFound(new { error = "Tenant not found." });

            return Ok(new
            {
                subscriptionActive = tenant.SubscriptionActive,
                soaCredits = tenant.SoaCredits,
                planName = tenant.PlanName ?? ""
            });
        }

        /// <summary>
        /// POST /api/v1/billing/checkout — creates a Stripe Checkout session.
        /// </summary>
        [HttpPost("checkout")]
        public async Task<IActionResult> CreateCheckoutSession([FromBody] CheckoutRequest request)
        {
            if (string.IsNullOrWhiteSpace(request?.PriceType))
                return BadRequest(new { error = "priceType is required." });

            var tenantId = GetTenantId();
            if (tenantId == Guid.Empty)
                return Unauthorized(new { error = "Tenant ID not found in token." });

            // Resolve frontend alias to canonical price type
            var priceType = FrontendPriceTypeAliases.TryGetValue(request.PriceType, out var mapped)
                ? mapped
                : request.PriceType;

            if (!StripeCheckoutService.IsValidPriceType(priceType))
                return BadRequest(new { error = $"Invalid price type: {request.PriceType}" });

            var baseUrl = _configuration["App:BaseUrl"] ?? $"{Request.Scheme}://{Request.Host}";
            var successUrl = $"{baseUrl}/billing/success?session_id={{CHECKOUT_SESSION_ID}}";
            var cancelUrl = $"{baseUrl}/billing/cancel";

            var session = await _stripeCheckout.CreateCheckoutSessionAsync(
                tenantId.ToString(),
                priceType,
                successUrl,
                cancelUrl);

            return Ok(new { url = session.Url });
        }

        // ── JWT claim helpers ──────────────────────────────────────

        private Guid GetTenantId()
        {
            var claim = User.FindFirst("tenant_id") ?? User.FindFirst("tenantId");
            return claim != null && Guid.TryParse(claim.Value, out var id) ? id : Guid.Empty;
        }
    }
}
