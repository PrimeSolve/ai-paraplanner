using System;
using System.Linq;
using System.Security.Claims;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PrimeSolve.Api.Data;
using PrimeSolve.Api.Models;

namespace PrimeSolve.Api.Controllers
{
    [ApiController]
    [Route("api/v1/advice-requests")]
    [Authorize]
    public class AdviceRequestsController : ControllerBase
    {
        private readonly AppDbContext _db;

        public AdviceRequestsController(AppDbContext db)
        {
            _db = db;
        }

        /// <summary>
        /// GET /advice-requests — list all advice requests for the tenant.
        /// Supports optional ?clientId filter.
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] Guid? clientId)
        {
            var tenantId = GetTenantId();
            if (tenantId == Guid.Empty)
                return Unauthorized(new { error = "Tenant ID not found in token." });

            IQueryable<AdviceRequest> query = _db.AdviceRequests
                .Where(ar => ar.TenantId == tenantId);

            if (clientId.HasValue)
                query = query.Where(ar => ar.ClientId == clientId.Value);

            query = query.OrderByDescending(ar => ar.CreatedDate);

            var records = await query.ToListAsync();
            var results = records.Select(BuildResponse).ToList();

            return Ok(results);
        }

        /// <summary>
        /// GET /advice-requests/{id} — returns a single advice request.
        /// The stored JSON data is unpacked as top-level properties in the response,
        /// merged with id, tenantId, createdDate, updatedDate.
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var tenantId = GetTenantId();

            var record = await _db.AdviceRequests
                .FirstOrDefaultAsync(ar => ar.Id == id && ar.TenantId == tenantId);

            if (record == null)
                return NotFound();

            return Ok(BuildResponse(record));
        }

        /// <summary>
        /// POST /advice-requests — creates a new advice request.
        /// Accepts arbitrary JSON body; the entire body is stored as-is in the Data column.
        /// Returns the stored data merged with id, tenantId, createdDate, updatedDate.
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] JsonElement body)
        {
            var tenantId = GetTenantId();
            if (tenantId == Guid.Empty)
                return Unauthorized(new { error = "Tenant ID not found in token." });

            // Extract clientId from body if present
            Guid? clientId = null;
            if (body.TryGetProperty("clientId", out var clientIdProp) &&
                clientIdProp.ValueKind == JsonValueKind.String &&
                Guid.TryParse(clientIdProp.GetString(), out var cid))
            {
                clientId = cid;
            }

            var record = new AdviceRequest
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                ClientId = clientId,
                Data = body.GetRawText(),
                CreatedDate = DateTime.UtcNow,
                UpdatedDate = DateTime.UtcNow
            };

            _db.AdviceRequests.Add(record);
            await _db.SaveChangesAsync();

            return Ok(BuildResponse(record));
        }

        /// <summary>
        /// PUT /advice-requests/{id} — full-replace update.
        /// The entire request body replaces the stored Data JSON.
        /// Returns the updated record.
        /// </summary>
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] JsonElement body)
        {
            var tenantId = GetTenantId();

            var record = await _db.AdviceRequests
                .FirstOrDefaultAsync(ar => ar.Id == id && ar.TenantId == tenantId);

            if (record == null)
                return NotFound();

            // Update clientId if present in body
            if (body.TryGetProperty("clientId", out var clientIdProp) &&
                clientIdProp.ValueKind == JsonValueKind.String &&
                Guid.TryParse(clientIdProp.GetString(), out var cid))
            {
                record.ClientId = cid;
            }

            record.Data = body.GetRawText();
            record.UpdatedDate = DateTime.UtcNow;

            await _db.SaveChangesAsync();

            return Ok(BuildResponse(record));
        }

        /// <summary>
        /// DELETE /advice-requests/{id} — deletes an advice request.
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var tenantId = GetTenantId();

            var record = await _db.AdviceRequests
                .FirstOrDefaultAsync(ar => ar.Id == id && ar.TenantId == tenantId);

            if (record == null)
                return NotFound();

            _db.AdviceRequests.Remove(record);
            await _db.SaveChangesAsync();

            return NoContent();
        }

        // ── Response builder ─────────────────────────────────────────

        /// <summary>
        /// Builds the API response by merging stored JSON data with record metadata.
        /// The stored Data JSON properties become top-level keys in the response,
        /// alongside id, tenantId, clientId, createdDate, updatedDate.
        /// </summary>
        private JsonObject BuildResponse(AdviceRequest record)
        {
            JsonObject result;

            if (!string.IsNullOrEmpty(record.Data))
            {
                try
                {
                    result = JsonNode.Parse(record.Data)?.AsObject() ?? new JsonObject();
                }
                catch
                {
                    result = new JsonObject();
                }
            }
            else
            {
                result = new JsonObject();
            }

            // Overlay metadata (these take precedence over any stored values)
            result["id"] = record.Id.ToString();
            result["tenantId"] = record.TenantId.ToString();
            if (record.ClientId.HasValue)
                result["clientId"] = record.ClientId.Value.ToString();
            result["createdDate"] = record.CreatedDate.ToString("o");
            result["updatedDate"] = record.UpdatedDate.ToString("o");

            return result;
        }

        // ── JWT claim helpers ────────────────────────────────────────

        private Guid GetTenantId()
        {
            var claim = User.FindFirst("tenant_id") ?? User.FindFirst("tenantId");
            return claim != null && Guid.TryParse(claim.Value, out var id) ? id : Guid.Empty;
        }
    }
}
