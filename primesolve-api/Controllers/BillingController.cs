using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PrimeSolve.Api.Data;

namespace PrimeSolve.Api.Controllers
{
    [ApiController]
    [Route("api/v1/billing")]
    [Authorize]
    public class BillingController : ControllerBase
    {
        private readonly AppDbContext _db;

        public BillingController(AppDbContext db)
        {
            _db = db;
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

        // ── JWT claim helpers ──────────────────────────────────────

        private Guid GetTenantId()
        {
            var claim = User.FindFirst("tenant_id") ?? User.FindFirst("tenantId");
            return claim != null && Guid.TryParse(claim.Value, out var id) ? id : Guid.Empty;
        }
    }
}
