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
    [Route("api/v1/clients/me")]
    [Authorize]
    public class ClientMeController : ControllerBase
    {
        private readonly AppDbContext _db;

        public ClientMeController(AppDbContext db)
        {
            _db = db;
        }

        // ── PUT /api/v1/clients/me/seen-welcome ──────────────────
        [HttpPut("seen-welcome")]
        public async Task<IActionResult> MarkSeenWelcome()
        {
            var client = await FindClientByEmailAsync();
            if (client == null)
                return NotFound(new { error = "Client not found." });

            client.HasSeenWelcome = true;
            await _db.SaveChangesAsync();

            return Ok(new { has_seen_welcome = true });
        }

        // ── Helpers ───────────────────────────────────────────────

        private async Task<Models.Client?> FindClientByEmailAsync()
        {
            var email = User.FindFirst("email")?.Value
                     ?? User.FindFirst(ClaimTypes.Email)?.Value;
            var tenantId = GetTenantId();

            if (string.IsNullOrEmpty(email) || tenantId == Guid.Empty)
                return null;

            return await _db.Clients
                .FirstOrDefaultAsync(c => c.Email == email && c.TenantId == tenantId);
        }

        private Guid GetTenantId()
        {
            var claim = User.FindFirst("tenant_id") ?? User.FindFirst("tenantId");
            return claim != null && Guid.TryParse(claim.Value, out var id) ? id : Guid.Empty;
        }
    }
}
