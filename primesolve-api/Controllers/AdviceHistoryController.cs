using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PrimeSolve.Api.Data;
using PrimeSolve.Api.Models;

namespace PrimeSolve.Api.Controllers
{
    [ApiController]
    [Route("api/v1/clients/{clientId}/advice-history")]
    [Authorize]
    public class AdviceHistoryController : ControllerBase
    {
        private readonly AppDbContext _db;

        public AdviceHistoryController(AppDbContext db)
        {
            _db = db;
        }

        /// <summary>
        /// POST /clients/{clientId}/advice-history — creates an immutable advice record.
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> Create(Guid clientId, [FromBody] CreateAdviceRecordRequest request)
        {
            var tenantId = GetTenantId();
            if (tenantId == Guid.Empty)
                return Unauthorized(new { error = "Tenant ID not found in token." });

            var adviserId = GetAdviserId();
            if (adviserId == Guid.Empty)
                return Unauthorized(new { error = "Adviser ID not found in token." });

            var createdBy = GetAdviserName() ?? GetAdviserEmail() ?? "Unknown";

            var record = new AdviceRecord
            {
                Id = Guid.NewGuid(),
                ClientId = clientId,
                AdviserId = adviserId,
                TenantId = tenantId,
                Type = request.Type,
                Name = request.Name,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = createdBy,
                SnapshotJson = request.SnapshotJson ?? "{}"
            };

            _db.AdviceRecords.Add(record);
            await _db.SaveChangesAsync();

            return Ok(new
            {
                id = record.Id,
                clientId = record.ClientId,
                type = record.Type,
                name = record.Name,
                createdAt = record.CreatedAt,
                createdBy = record.CreatedBy
            });
        }

        /// <summary>
        /// GET /clients/{clientId}/advice-history — list all records (without snapshotJson).
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetAll(Guid clientId)
        {
            var tenantId = GetTenantId();
            if (tenantId == Guid.Empty)
                return Unauthorized(new { error = "Tenant ID not found in token." });

            var records = await _db.AdviceRecords
                .Where(r => r.ClientId == clientId && r.TenantId == tenantId)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new
                {
                    id = r.Id,
                    type = r.Type,
                    name = r.Name,
                    createdAt = r.CreatedAt,
                    createdBy = r.CreatedBy
                })
                .ToListAsync();

            return Ok(records);
        }

        /// <summary>
        /// GET /clients/{clientId}/advice-history/{id} — full record including snapshotJson.
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid clientId, Guid id)
        {
            var tenantId = GetTenantId();
            if (tenantId == Guid.Empty)
                return Unauthorized(new { error = "Tenant ID not found in token." });

            var record = await _db.AdviceRecords
                .FirstOrDefaultAsync(r => r.Id == id && r.ClientId == clientId && r.TenantId == tenantId);

            if (record == null)
                return NotFound();

            return Ok(new
            {
                id = record.Id,
                clientId = record.ClientId,
                adviserId = record.AdviserId,
                tenantId = record.TenantId,
                type = record.Type,
                name = record.Name,
                createdAt = record.CreatedAt,
                createdBy = record.CreatedBy,
                snapshotJson = record.SnapshotJson
            });
        }

        // ── JWT claim helpers ──────────────────────────────────────

        private Guid GetTenantId()
        {
            var claim = User.FindFirst("tenant_id") ?? User.FindFirst("tenantId");
            return claim != null && Guid.TryParse(claim.Value, out var id) ? id : Guid.Empty;
        }

        private Guid GetAdviserId()
        {
            var claim = User.FindFirst("adviser_id")
                     ?? User.FindFirst("adviserId")
                     ?? User.FindFirst(ClaimTypes.NameIdentifier);
            return claim != null && Guid.TryParse(claim.Value, out var id) ? id : Guid.Empty;
        }

        private string? GetAdviserName()
        {
            var claim = User.FindFirst("name")
                     ?? User.FindFirst("full_name")
                     ?? User.FindFirst(ClaimTypes.Name);
            return claim?.Value;
        }

        private string? GetAdviserEmail()
        {
            var claim = User.FindFirst("adviser_email")
                     ?? User.FindFirst("email")
                     ?? User.FindFirst(ClaimTypes.Email);
            return claim?.Value;
        }
    }

    public class CreateAdviceRecordRequest
    {
        public string Type { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? SnapshotJson { get; set; }
    }
}
