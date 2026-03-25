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
    [Route("api/v1/tickets")]
    [Authorize]
    public class TicketsController : ControllerBase
    {
        private readonly AppDbContext _db;

        public TicketsController(AppDbContext db)
        {
            _db = db;
        }

        // TODO: AI assistant auto-response — build at Global Admin level
        // TODO: Twilio SMS + email notifications — configure at Global Admin level

        /// <summary>
        /// GET /tickets?adviserId={adviserId}
        /// Returns all tickets for the adviser, ordered by CreatedAt descending.
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] Guid? adviserId)
        {
            var tenantId = GetTenantId();
            if (tenantId == Guid.Empty)
                return Unauthorized(new { error = "Tenant ID not found in token." });

            var currentAdviserId = GetAdviserId();
            var role = GetRole();

            bool isAdmin = string.Equals(role, "TenantAdmin", StringComparison.OrdinalIgnoreCase)
                        || string.Equals(role, "PlatformAdmin", StringComparison.OrdinalIgnoreCase);

            IQueryable<Ticket> query = _db.Tickets.Where(t => t.TenantId == tenantId);

            if (!isAdmin)
            {
                // Advisers can only see their own tickets
                var scopedId = adviserId ?? currentAdviserId;
                if (scopedId == Guid.Empty)
                    return Unauthorized(new { error = "Adviser ID not found in token." });

                if (scopedId != currentAdviserId && currentAdviserId != Guid.Empty)
                    return Forbid();

                query = query.Where(t => t.AdviserId == scopedId);
            }
            else if (adviserId.HasValue)
            {
                // Admins can optionally filter by adviser
                query = query.Where(t => t.AdviserId == adviserId.Value);
            }

            var tickets = await query
                .OrderByDescending(t => t.CreatedAt)
                .Select(t => MapToResponse(t, null, null, null))
                .ToListAsync();

            // Enrich with related client/SOA names
            var enriched = new List<object>();
            foreach (var ticket in await query.OrderByDescending(t => t.CreatedAt).ToListAsync())
            {
                string? clientName = null;
                string? soaTitle = null;

                if (ticket.RelatedClientId.HasValue)
                {
                    var client = await _db.Clients.FirstOrDefaultAsync(c => c.Id == ticket.RelatedClientId.Value);
                    if (client != null)
                        clientName = $"{client.FirstName} {client.LastName}".Trim();
                }

                enriched.Add(new
                {
                    id = ticket.Id,
                    ticketNumber = ticket.TicketNumber,
                    adviserId = ticket.AdviserId,
                    adviceGroupId = ticket.AdviceGroupId,
                    tenantId = ticket.TenantId,
                    subject = ticket.Subject,
                    category = ticket.Category,
                    priority = ticket.Priority,
                    description = ticket.Description,
                    status = ticket.Status,
                    relatedClientId = ticket.RelatedClientId,
                    relatedClientName = clientName,
                    relatedSOAId = ticket.RelatedSOAId,
                    relatedSOATitle = soaTitle,
                    relatedFeature = ticket.RelatedFeature,
                    additionalContext = ticket.AdditionalContext,
                    createdAt = ticket.CreatedAt,
                    updatedAt = ticket.UpdatedAt
                });
            }

            return Ok(enriched);
        }

        /// <summary>
        /// POST /tickets — creates a new ticket.
        /// Auto-sets CreatedAt, UpdatedAt, Status, AdviceGroupId, TenantId.
        /// Auto-increments TicketNumber (max + 1, starting at 1001).
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateTicketRequest request)
        {
            var tenantId = GetTenantId();
            if (tenantId == Guid.Empty)
                return Unauthorized(new { error = "Tenant ID not found in token." });

            var adviserId = GetAdviserId();
            if (adviserId == Guid.Empty)
                return Unauthorized(new { error = "Adviser ID not found in token." });

            // Validate required fields
            if (string.IsNullOrWhiteSpace(request.Subject))
                return BadRequest(new { error = "Subject is required." });
            if (string.IsNullOrWhiteSpace(request.Category))
                return BadRequest(new { error = "Category is required." });
            if (string.IsNullOrWhiteSpace(request.Description))
                return BadRequest(new { error = "Description is required." });

            // Validate category
            var validCategories = new[] { "Billing", "Technical", "SOA", "Other" };
            if (!validCategories.Contains(request.Category))
                return BadRequest(new { error = "Category must be one of: Billing, Technical, SOA, Other." });

            // Validate priority
            var validPriorities = new[] { "Low", "Medium", "High", "Urgent" };
            var priority = string.IsNullOrWhiteSpace(request.Priority) ? "Medium" : request.Priority;
            if (!validPriorities.Contains(priority))
                return BadRequest(new { error = "Priority must be one of: Low, Medium, High, Urgent." });

            // Derive AdviceGroupId from tenant (AdviceGroup = Tenant in this system)
            var adviceGroupId = tenantId;

            // Auto-increment ticket number (start at 1001)
            var maxTicketNumber = await _db.Tickets
                .Where(t => t.TenantId == tenantId)
                .MaxAsync(t => (int?)t.TicketNumber) ?? 1000;
            var ticketNumber = maxTicketNumber + 1;

            var now = DateTime.UtcNow;
            var ticket = new Ticket
            {
                Id = Guid.NewGuid(),
                TicketNumber = ticketNumber,
                AdviserId = adviserId,
                AdviceGroupId = adviceGroupId,
                TenantId = tenantId,
                Subject = request.Subject,
                Category = request.Category,
                Priority = priority,
                Description = request.Description,
                Status = "Open",
                RelatedClientId = request.RelatedClientId,
                RelatedSOAId = request.RelatedSOAId,
                RelatedFeature = request.RelatedFeature,
                AdditionalContext = request.AdditionalContext,
                CreatedAt = now,
                UpdatedAt = now
            };

            _db.Tickets.Add(ticket);
            await _db.SaveChangesAsync();

            // Enrich response with client name if applicable
            string? clientName = null;
            if (ticket.RelatedClientId.HasValue)
            {
                var client = await _db.Clients.FirstOrDefaultAsync(c => c.Id == ticket.RelatedClientId.Value);
                if (client != null)
                    clientName = $"{client.FirstName} {client.LastName}".Trim();
            }

            return Ok(new
            {
                id = ticket.Id,
                ticketNumber = ticket.TicketNumber,
                adviserId = ticket.AdviserId,
                adviceGroupId = ticket.AdviceGroupId,
                tenantId = ticket.TenantId,
                subject = ticket.Subject,
                category = ticket.Category,
                priority = ticket.Priority,
                description = ticket.Description,
                status = ticket.Status,
                relatedClientId = ticket.RelatedClientId,
                relatedClientName = clientName,
                relatedSOAId = ticket.RelatedSOAId,
                relatedSOATitle = (string?)null,
                relatedFeature = ticket.RelatedFeature,
                additionalContext = ticket.AdditionalContext,
                createdAt = ticket.CreatedAt,
                updatedAt = ticket.UpdatedAt
            });
        }

        /// <summary>
        /// GET /tickets/{id} — returns a single ticket by ID.
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var tenantId = GetTenantId();
            if (tenantId == Guid.Empty)
                return Unauthorized(new { error = "Tenant ID not found in token." });

            var adviserId = GetAdviserId();
            var role = GetRole();

            var ticket = await _db.Tickets
                .FirstOrDefaultAsync(t => t.Id == id && t.TenantId == tenantId);

            if (ticket == null)
                return NotFound();

            bool isAdmin = string.Equals(role, "TenantAdmin", StringComparison.OrdinalIgnoreCase)
                        || string.Equals(role, "PlatformAdmin", StringComparison.OrdinalIgnoreCase);

            if (!isAdmin && adviserId != Guid.Empty && ticket.AdviserId != adviserId)
                return NotFound();

            string? clientName = null;
            if (ticket.RelatedClientId.HasValue)
            {
                var client = await _db.Clients.FirstOrDefaultAsync(c => c.Id == ticket.RelatedClientId.Value);
                if (client != null)
                    clientName = $"{client.FirstName} {client.LastName}".Trim();
            }

            return Ok(new
            {
                id = ticket.Id,
                ticketNumber = ticket.TicketNumber,
                adviserId = ticket.AdviserId,
                adviceGroupId = ticket.AdviceGroupId,
                tenantId = ticket.TenantId,
                subject = ticket.Subject,
                category = ticket.Category,
                priority = ticket.Priority,
                description = ticket.Description,
                status = ticket.Status,
                relatedClientId = ticket.RelatedClientId,
                relatedClientName = clientName,
                relatedSOAId = ticket.RelatedSOAId,
                relatedSOATitle = (string?)null,
                relatedFeature = ticket.RelatedFeature,
                additionalContext = ticket.AdditionalContext,
                createdAt = ticket.CreatedAt,
                updatedAt = ticket.UpdatedAt
            });
        }

        /// <summary>
        /// PATCH /tickets/{id}/status — updates ticket status.
        /// Advisers can only set status to "Resolved". InProgress is for admin only.
        /// </summary>
        [HttpPatch("{id}/status")]
        public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateTicketStatusRequest request)
        {
            var tenantId = GetTenantId();
            if (tenantId == Guid.Empty)
                return Unauthorized(new { error = "Tenant ID not found in token." });

            var adviserId = GetAdviserId();
            var role = GetRole();

            var ticket = await _db.Tickets
                .FirstOrDefaultAsync(t => t.Id == id && t.TenantId == tenantId);

            if (ticket == null)
                return NotFound();

            bool isAdmin = string.Equals(role, "TenantAdmin", StringComparison.OrdinalIgnoreCase)
                        || string.Equals(role, "PlatformAdmin", StringComparison.OrdinalIgnoreCase);

            // Non-admin users can only update their own tickets
            if (!isAdmin && adviserId != Guid.Empty && ticket.AdviserId != adviserId)
                return NotFound();

            var validStatuses = new[] { "Open", "InProgress", "Resolved" };
            if (!validStatuses.Contains(request.Status))
                return BadRequest(new { error = "Status must be one of: Open, InProgress, Resolved." });

            // Advisers can only set to Resolved (not InProgress)
            if (!isAdmin && request.Status == "InProgress")
                return Forbid();

            ticket.Status = request.Status;
            ticket.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return Ok(new
            {
                id = ticket.Id,
                ticketNumber = ticket.TicketNumber,
                status = ticket.Status,
                updatedAt = ticket.UpdatedAt
            });
        }

        // ── Helper ──────────────────────────────────────────────────

        private static object MapToResponse(Ticket t, string? clientName, string? soaTitle, string? soaId)
        {
            return new
            {
                id = t.Id,
                ticketNumber = t.TicketNumber,
                adviserId = t.AdviserId,
                adviceGroupId = t.AdviceGroupId,
                tenantId = t.TenantId,
                subject = t.Subject,
                category = t.Category,
                priority = t.Priority,
                description = t.Description,
                status = t.Status,
                relatedClientId = t.RelatedClientId,
                relatedClientName = clientName,
                relatedSOAId = t.RelatedSOAId,
                relatedSOATitle = soaTitle,
                relatedFeature = t.RelatedFeature,
                additionalContext = t.AdditionalContext,
                createdAt = t.CreatedAt,
                updatedAt = t.UpdatedAt
            };
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

        private string? GetRole()
        {
            var claim = User.FindFirst("role")
                     ?? User.FindFirst(ClaimTypes.Role);
            return claim?.Value;
        }
    }

    // ── Request DTOs ────────────────────────────────────────────

    public class CreateTicketRequest
    {
        public string Subject { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string Priority { get; set; } = "Medium";
        public string Description { get; set; } = string.Empty;
        public Guid? RelatedClientId { get; set; }
        public Guid? RelatedSOAId { get; set; }
        public string? RelatedFeature { get; set; }
        public string? AdditionalContext { get; set; }
    }

    public class UpdateTicketStatusRequest
    {
        public string Status { get; set; } = string.Empty;
    }
}
