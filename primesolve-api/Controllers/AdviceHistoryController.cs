using System;
using System.Linq;
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
        /// POST /clients/{clientId}/advice-history
        /// Creates a new immutable AdviceRecord snapshot.
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

            var createdBy = GetUserName();

            var record = new AdviceRecord
            {
                Id = Guid.NewGuid(),
                ClientId = clientId,
                AdviserId = adviserId,
                TenantId = tenantId,
                RecordType = request.RecordType,
                Title = request.Title,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = createdBy,
                FactFindSnapshot = request.FactFindSnapshot,
                AdviceModelSnapshot = request.AdviceModelSnapshot,
                ProjectionSnapshot = request.ProjectionSnapshot
            };

            _db.AdviceRecords.Add(record);
            await _db.SaveChangesAsync();

            return Ok(new
            {
                id = record.Id,
                clientId = record.ClientId,
                recordType = record.RecordType,
                title = record.Title,
                createdAt = record.CreatedAt,
                createdBy = record.CreatedBy
            });
        }

        /// <summary>
        /// GET /clients/{clientId}/advice-history
        /// Returns all records for the client, ordered by createdAt DESC.
        /// Does NOT return snapshotJson (too large for list).
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
                    clientId = r.ClientId,
                    recordType = r.RecordType,
                    title = r.Title,
                    createdAt = r.CreatedAt,
                    createdBy = r.CreatedBy
                })
                .ToListAsync();

            return Ok(records);
        }

        /// <summary>
        /// GET /clients/{clientId}/advice-history/{id}
        /// Returns the full record including snapshotJson.
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
                recordType = record.RecordType,
                title = record.Title,
                createdAt = record.CreatedAt,
                createdBy = record.CreatedBy,
                factFindSnapshot = record.FactFindSnapshot,
                adviceModelSnapshot = record.AdviceModelSnapshot,
                projectionSnapshot = record.ProjectionSnapshot
            });
        }

        private Guid GetTenantId()
        {
            var claim = User.FindFirst("tenant_id") ?? User.FindFirst("tenantId");
            return claim != null && Guid.TryParse(claim.Value, out var id) ? id : Guid.Empty;
        }

        private Guid GetAdviserId()
        {
            var claim = User.FindFirst("adviser_id") ?? User.FindFirst("adviserId") ?? User.FindFirst("sub");
            return claim != null && Guid.TryParse(claim.Value, out var id) ? id : Guid.Empty;
        }

        private string GetUserName()
        {
            var name = User.FindFirst("name")?.Value
                ?? User.FindFirst("preferred_username")?.Value
                ?? User.FindFirst("email")?.Value
                ?? "Unknown";
            return name;
        }
    }

    public class CreateAdviceRecordRequest
    {
        public string RecordType { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string? FactFindSnapshot { get; set; }
        public string? AdviceModelSnapshot { get; set; }
        public string? ProjectionSnapshot { get; set; }
    }
}
