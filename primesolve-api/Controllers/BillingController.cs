using System;
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
        /// GET /api/v1/billing/status — returns the billing status for the
        /// authenticated user's tenant (licence type, subscription state, SOA credits).
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
                licenceType = tenant.LicenceType,
                subscriptionActive = tenant.SubscriptionActive,
                soaCredits = tenant.SoaCredits
            });
        }

        /// <summary>
        /// POST /api/v1/billing/use-credit — deducts 1 SOA credit from the tenant's
        /// balance if credits are available. Returns the new balance.
        /// </summary>
        [HttpPost("use-credit")]
        public async Task<IActionResult> UseCredit()
        {
            var tenantId = GetTenantId();
            if (tenantId == Guid.Empty)
                return Unauthorized(new { error = "Tenant ID not found in token." });

            var tenant = await _db.Tenants.FirstOrDefaultAsync(t => t.Id == tenantId);
            if (tenant == null)
                return NotFound(new { error = "Tenant not found." });

            if (tenant.SoaCredits <= 0)
                return BadRequest(new { error = "No SOA credits remaining.", soaCredits = 0 });

            tenant.SoaCredits -= 1;
            await _db.SaveChangesAsync();

            return Ok(new { soaCredits = tenant.SoaCredits });
        }

        private Guid GetTenantId()
        {
            var claim = User.FindFirst("tenant_id") ?? User.FindFirst("tenantId");
            return claim != null && Guid.TryParse(claim.Value, out var id) ? id : Guid.Empty;
        }
    }
}
