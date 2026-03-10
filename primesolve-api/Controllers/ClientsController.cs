using System;
using System.Linq;
using System.Security.Claims;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PrimeSolve.Api.Data;
using PrimeSolve.Api.Models;

namespace PrimeSolve.Api.Controllers
{
    [ApiController]
    [Route("api/v1/clients")]
    [Authorize]
    public class ClientsController : ControllerBase
    {
        private readonly AppDbContext _db;

        public ClientsController(AppDbContext db)
        {
            _db = db;
        }

        /// <summary>
        /// GET /clients — returns clients scoped to the current adviser.
        /// TenantAdmin and PlatformAdmin roles can see all clients within their tenant.
        /// Supports optional query filters: adviserEmail, sort.
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] string? adviserEmail,
            [FromQuery] string? sort)
        {
            var tenantId = GetTenantId();
            if (tenantId == Guid.Empty)
                return Unauthorized(new { error = "Tenant ID not found in token." });

            var adviserId = GetAdviserId();
            var role = GetRole();

            IQueryable<Client> query = _db.Clients.Where(c => c.TenantId == tenantId);

            // Non-admin users can only see their own clients
            bool isAdmin = string.Equals(role, "TenantAdmin", StringComparison.OrdinalIgnoreCase)
                        || string.Equals(role, "PlatformAdmin", StringComparison.OrdinalIgnoreCase);

            if (!isAdmin)
            {
                // Scope to the adviser's own clients
                if (adviserId != Guid.Empty)
                {
                    query = query.Where(c => c.AdviserId == adviserId);
                }
                else if (!string.IsNullOrEmpty(adviserEmail))
                {
                    query = query.Where(c => c.AdviserEmail == adviserEmail);
                }
            }
            else if (!string.IsNullOrEmpty(adviserEmail))
            {
                // Admins can optionally filter by adviserEmail
                query = query.Where(c => c.AdviserEmail == adviserEmail);
            }

            // Sorting (default: newest first)
            query = sort switch
            {
                "-created_date" or "-createdDate" => query.OrderByDescending(c => c.CreatedDate),
                "created_date" or "createdDate" => query.OrderBy(c => c.CreatedDate),
                _ => query.OrderByDescending(c => c.CreatedDate)
            };

            var clients = await query.Select(c => new
            {
                id = c.Id,
                tenantId = c.TenantId,
                adviserId = c.AdviserId,
                adviserEmail = c.AdviserEmail,
                firstName = c.FirstName,
                lastName = c.LastName,
                email = c.Email,
                phone = c.Phone,
                notes = c.Notes,
                status = c.Status,
                factFind = c.FactFind,
                factFindId = c.FactFindId,
                soas = c.Soas,
                createdDate = c.CreatedDate
            }).ToListAsync();

            return Ok(clients);
        }

        /// <summary>
        /// GET /clients/{id} — returns a single client, scoped by tenant.
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var tenantId = GetTenantId();
            var adviserId = GetAdviserId();
            var role = GetRole();

            var client = await _db.Clients
                .FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId);

            if (client == null)
                return NotFound();

            // Non-admin users can only access their own clients
            bool isAdmin = string.Equals(role, "TenantAdmin", StringComparison.OrdinalIgnoreCase)
                        || string.Equals(role, "PlatformAdmin", StringComparison.OrdinalIgnoreCase);

            if (!isAdmin && adviserId != Guid.Empty && client.AdviserId != adviserId)
                return NotFound();

            return Ok(new
            {
                id = client.Id,
                tenantId = client.TenantId,
                adviserId = client.AdviserId,
                adviserEmail = client.AdviserEmail,
                firstName = client.FirstName,
                lastName = client.LastName,
                email = client.Email,
                phone = client.Phone,
                notes = client.Notes,
                status = client.Status,
                factFind = client.FactFind,
                factFindId = client.FactFindId,
                soas = client.Soas,
                createdDate = client.CreatedDate
            });
        }

        /// <summary>
        /// POST /clients — creates a new client.
        /// Adviser ID and Tenant ID are always stamped from the JWT — never trusted from the body.
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateClientRequest request)
        {
            var tenantId = GetTenantId();
            if (tenantId == Guid.Empty)
                return Unauthorized(new { error = "Tenant ID not found in token." });

            var adviserId = GetAdviserId();
            if (adviserId == Guid.Empty)
                return Unauthorized(new { error = "Adviser ID not found in token." });

            var adviserEmail = GetAdviserEmail();

            var client = new Client
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                AdviserId = adviserId,
                AdviserEmail = adviserEmail ?? request.AdviserEmail ?? string.Empty,
                FirstName = request.FirstName,
                LastName = request.LastName,
                Email = request.Email,
                Phone = request.Phone,
                Notes = request.Notes,
                Status = request.Status ?? "prospect",
                FactFind = "not_started",
                Soas = 0,
                CreatedDate = DateTime.UtcNow
            };

            _db.Clients.Add(client);
            await _db.SaveChangesAsync();

            return Ok(new
            {
                id = client.Id,
                tenantId = client.TenantId,
                adviserId = client.AdviserId,
                adviserEmail = client.AdviserEmail,
                firstName = client.FirstName,
                lastName = client.LastName,
                email = client.Email,
                phone = client.Phone,
                notes = client.Notes,
                status = client.Status,
                factFind = client.FactFind,
                factFindId = client.FactFindId,
                soas = client.Soas,
                createdDate = client.CreatedDate
            });
        }

        /// <summary>
        /// PUT /clients/{id} — updates an existing client.
        /// </summary>
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateClientRequest request)
        {
            var tenantId = GetTenantId();
            var adviserId = GetAdviserId();
            var role = GetRole();

            var client = await _db.Clients
                .FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId);

            if (client == null)
                return NotFound();

            bool isAdmin = string.Equals(role, "TenantAdmin", StringComparison.OrdinalIgnoreCase)
                        || string.Equals(role, "PlatformAdmin", StringComparison.OrdinalIgnoreCase);

            if (!isAdmin && adviserId != Guid.Empty && client.AdviserId != adviserId)
                return NotFound();

            // Update only provided fields
            if (request.FirstName != null) client.FirstName = request.FirstName;
            if (request.LastName != null) client.LastName = request.LastName;
            if (request.Email != null) client.Email = request.Email;
            if (request.Phone != null) client.Phone = request.Phone;
            if (request.Notes != null) client.Notes = request.Notes;
            if (request.Status != null) client.Status = request.Status;
            if (request.FactFind != null) client.FactFind = request.FactFind;
            if (request.FactFindId.HasValue) client.FactFindId = request.FactFindId;

            await _db.SaveChangesAsync();

            return Ok(new
            {
                id = client.Id,
                tenantId = client.TenantId,
                adviserId = client.AdviserId,
                adviserEmail = client.AdviserEmail,
                firstName = client.FirstName,
                lastName = client.LastName,
                email = client.Email,
                phone = client.Phone,
                notes = client.Notes,
                status = client.Status,
                factFind = client.FactFind,
                factFindId = client.FactFindId,
                soas = client.Soas,
                createdDate = client.CreatedDate
            });
        }

        /// <summary>
        /// DELETE /clients/{id} — deletes a client.
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var tenantId = GetTenantId();
            var adviserId = GetAdviserId();
            var role = GetRole();

            var client = await _db.Clients
                .FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId);

            if (client == null)
                return NotFound();

            bool isAdmin = string.Equals(role, "TenantAdmin", StringComparison.OrdinalIgnoreCase)
                        || string.Equals(role, "PlatformAdmin", StringComparison.OrdinalIgnoreCase);

            if (!isAdmin && adviserId != Guid.Empty && client.AdviserId != adviserId)
                return NotFound();

            _db.Clients.Remove(client);
            await _db.SaveChangesAsync();

            return NoContent();
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

        private string? GetAdviserEmail()
        {
            var claim = User.FindFirst("adviser_email")
                     ?? User.FindFirst("email")
                     ?? User.FindFirst(ClaimTypes.Email);
            return claim?.Value;
        }

        private string? GetRole()
        {
            var claim = User.FindFirst("role")
                     ?? User.FindFirst(ClaimTypes.Role);
            return claim?.Value;
        }
    }

    // ── Request DTOs ────────────────────────────────────────────

    public class CreateClientRequest
    {
        [JsonPropertyName("firstName")]
        public string FirstName { get; set; } = string.Empty;

        [JsonPropertyName("lastName")]
        public string LastName { get; set; } = string.Empty;

        [JsonPropertyName("email")]
        public string Email { get; set; } = string.Empty;

        [JsonPropertyName("phone")]
        public string? Phone { get; set; }

        [JsonPropertyName("notes")]
        public string? Notes { get; set; }

        [JsonPropertyName("adviserEmail")]
        public string? AdviserEmail { get; set; }

        [JsonPropertyName("status")]
        public string? Status { get; set; }

        // These are accepted but IGNORED — stamped from JWT instead
        [JsonPropertyName("adviserId")]
        public Guid? AdviserId { get; set; }

        [JsonPropertyName("tenantId")]
        public Guid? TenantId { get; set; }
    }

    public class UpdateClientRequest
    {
        [JsonPropertyName("firstName")]
        public string? FirstName { get; set; }

        [JsonPropertyName("lastName")]
        public string? LastName { get; set; }

        [JsonPropertyName("email")]
        public string? Email { get; set; }

        [JsonPropertyName("phone")]
        public string? Phone { get; set; }

        [JsonPropertyName("notes")]
        public string? Notes { get; set; }

        [JsonPropertyName("status")]
        public string? Status { get; set; }

        [JsonPropertyName("factFind")]
        public string? FactFind { get; set; }

        [JsonPropertyName("factFindId")]
        public Guid? FactFindId { get; set; }
    }
}
