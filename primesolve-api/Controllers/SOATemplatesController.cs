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
    [Route("api/v1/soa-templates")]
    [Authorize]
    public class SOATemplatesController : ControllerBase
    {
        private readonly AppDbContext _db;

        public SOATemplatesController(AppDbContext db)
        {
            _db = db;
        }

        /// <summary>
        /// GET /soa-templates?ownerType={ownerType}
        ///
        /// ownerType=0 (Admin): returns ALL admin templates regardless of caller's tenant.
        /// ownerType=1 (AdviceGroup): returns templates owned by caller's tenant.
        /// ownerType=2 (Adviser): returns templates where OwnerId matches the caller's adviser ID.
        /// No ownerType: returns admin templates + caller's tenant templates.
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int? ownerType)
        {
            IQueryable<SoaTemplate> query = _db.SoaTemplates;

            if (ownerType.HasValue && ownerType.Value == 0)
            {
                // Admin templates are platform-wide — no tenant filter required
                query = query.Where(t => t.OwnerType == 0);
            }
            else
            {
                // All other queries require a valid tenant ID
                var tenantId = GetTenantId();
                if (tenantId == Guid.Empty)
                    return Unauthorized(new { error = "Tenant ID not found in token." });

                if (ownerType.HasValue)
                {
                    if (ownerType.Value == 1)
                    {
                        query = query.Where(t => t.OwnerType == 1 && t.TenantId == tenantId);
                    }
                    else if (ownerType.Value == 2)
                    {
                        var adviserId = GetAdviserId();
                        query = query.Where(t => t.OwnerType == 2 && t.OwnerId == adviserId.ToString());
                    }
                }
                else
                {
                    // No filter: return admin templates + tenant-scoped templates
                    query = query.Where(t => t.OwnerType == 0 || t.TenantId == tenantId);
                }
            }

            var templates = await query
                .OrderByDescending(t => t.UpdatedAt)
                .Select(t => new
                {
                    id = t.Id,
                    name = t.Name,
                    description = t.Description,
                    ownerType = t.OwnerType,
                    ownerId = t.OwnerId,
                    tenantId = t.TenantId,
                    sections = t.Sections,
                    createdAt = t.CreatedAt,
                    updatedAt = t.UpdatedAt
                })
                .ToListAsync();

            return Ok(templates);
        }

        /// <summary>
        /// GET /soa-templates/available
        /// Returns all templates visible to the current user:
        /// - Templates owned by current tenant
        /// - Global Admin templates (OwnerType=0) with an active share (not hidden) for
        ///   the user's tenantId or SharedToTenantId=null
        /// - Advice Group templates (OwnerType=1) shared to the current tenant
        /// </summary>
        [HttpGet("available")]
        public async Task<IActionResult> GetAvailable()
        {
            var tenantId = GetTenantId();
            if (tenantId == Guid.Empty)
                return Unauthorized(new { error = "Tenant ID not found in token." });

            var adviserId = GetAdviserId();

            // IDs of Global Admin templates hidden by this tenant
            var hiddenTemplateIds = await _db.SoaTemplateShares
                .Where(s => s.IsHidden && s.SharedToTenantId == tenantId)
                .Select(s => s.TemplateId)
                .ToListAsync();

            // IDs of Global Admin templates that have been shared (to all or to this tenant)
            var sharedAdminTemplateIds = await _db.SoaTemplateShares
                .Where(s => !s.IsHidden &&
                    (s.SharedToTenantId == null || s.SharedToTenantId == tenantId))
                .Join(_db.SoaTemplates.Where(t => t.OwnerType == 0),
                    s => s.TemplateId, t => t.Id, (s, t) => t.Id)
                .Distinct()
                .ToListAsync();

            // IDs of Advice Group templates shared to this tenant
            var sharedGroupTemplateIds = await _db.SoaTemplateShares
                .Where(s => !s.IsHidden && s.SharedToTenantId == tenantId)
                .Join(_db.SoaTemplates.Where(t => t.OwnerType == 1),
                    s => s.TemplateId, t => t.Id, (s, t) => t.Id)
                .Distinct()
                .ToListAsync();

            var templates = await _db.SoaTemplates
                .Where(t =>
                    // Own tenant's templates
                    t.TenantId == tenantId ||
                    // Adviser's own templates
                    (t.OwnerType == 2 && t.OwnerId == adviserId.ToString()) ||
                    // Shared admin templates (not hidden)
                    (t.OwnerType == 0 && sharedAdminTemplateIds.Contains(t.Id)
                        && !hiddenTemplateIds.Contains(t.Id)) ||
                    // Shared advice group templates
                    (t.OwnerType == 1 && sharedGroupTemplateIds.Contains(t.Id)))
                .OrderByDescending(t => t.UpdatedAt)
                .Select(t => new
                {
                    id = t.Id,
                    name = t.Name,
                    description = t.Description,
                    ownerType = t.OwnerType,
                    ownerId = t.OwnerId,
                    tenantId = t.TenantId,
                    sections = t.Sections,
                    createdAt = t.CreatedAt,
                    updatedAt = t.UpdatedAt,
                    isShared = _db.SoaTemplateShares
                        .Any(s => s.TemplateId == t.Id && !s.IsHidden),
                    isHidden = _db.SoaTemplateShares
                        .Any(s => s.TemplateId == t.Id && s.IsHidden
                            && s.SharedToTenantId == tenantId)
                })
                .ToListAsync();

            return Ok(templates);
        }

        /// <summary>
        /// GET /soa-templates/resolve?adviserTemplateId=&amp;adviceGroupTemplateId=
        /// Resolves which template to use for SOA generation (adviser → group → admin fallback).
        /// </summary>
        [HttpGet("resolve")]
        public async Task<IActionResult> Resolve(
            [FromQuery] Guid? adviserTemplateId,
            [FromQuery] Guid? adviceGroupTemplateId)
        {
            SoaTemplate? template = null;

            if (adviserTemplateId.HasValue)
                template = await _db.SoaTemplates.FindAsync(adviserTemplateId.Value);

            if (template == null && adviceGroupTemplateId.HasValue)
                template = await _db.SoaTemplates.FindAsync(adviceGroupTemplateId.Value);

            // Fallback to admin default
            if (template == null)
                template = await _db.SoaTemplates
                    .Where(t => t.OwnerType == 0)
                    .OrderBy(t => t.CreatedAt)
                    .FirstOrDefaultAsync();

            if (template == null)
                return NotFound(new { error = "No template found." });

            return Ok(new
            {
                id = template.Id,
                name = template.Name,
                description = template.Description,
                ownerType = template.OwnerType,
                ownerId = template.OwnerId,
                tenantId = template.TenantId,
                sections = template.Sections,
                createdAt = template.CreatedAt,
                updatedAt = template.UpdatedAt
            });
        }

        /// <summary>
        /// GET /soa-templates/{id}
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var tenantId = GetTenantId();
            var template = await _db.SoaTemplates.FindAsync(id);
            if (template == null)
                return NotFound();

            var isShared = await _db.SoaTemplateShares
                .AnyAsync(s => s.TemplateId == id && !s.IsHidden);
            var isHidden = tenantId != Guid.Empty && await _db.SoaTemplateShares
                .AnyAsync(s => s.TemplateId == id && s.IsHidden
                    && s.SharedToTenantId == tenantId);

            return Ok(new
            {
                id = template.Id,
                name = template.Name,
                description = template.Description,
                ownerType = template.OwnerType,
                ownerId = template.OwnerId,
                tenantId = template.TenantId,
                sections = template.Sections,
                createdAt = template.CreatedAt,
                updatedAt = template.UpdatedAt,
                isShared,
                isHidden
            });
        }

        /// <summary>
        /// POST /soa-templates — create a new template.
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateSoaTemplateRequest request)
        {
            var tenantId = GetTenantId();
            if (tenantId == Guid.Empty)
                return Unauthorized(new { error = "Tenant ID not found in token." });

            if (string.IsNullOrWhiteSpace(request.Name))
                return BadRequest(new { error = "Name is required." });

            var now = DateTime.UtcNow;
            var template = new SoaTemplate
            {
                Id = Guid.NewGuid(),
                Name = request.Name,
                Description = request.Description,
                OwnerType = request.OwnerType,
                OwnerId = request.OwnerId,
                TenantId = tenantId,
                Sections = request.Sections,
                CreatedAt = now,
                UpdatedAt = now
            };

            _db.SoaTemplates.Add(template);
            await _db.SaveChangesAsync();

            return Ok(new
            {
                id = template.Id,
                name = template.Name,
                description = template.Description,
                ownerType = template.OwnerType,
                ownerId = template.OwnerId,
                tenantId = template.TenantId,
                sections = template.Sections,
                createdAt = template.CreatedAt,
                updatedAt = template.UpdatedAt
            });
        }

        /// <summary>
        /// PUT /soa-templates/{id} — update a template.
        /// </summary>
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateSoaTemplateRequest request)
        {
            var template = await _db.SoaTemplates.FindAsync(id);
            if (template == null)
                return NotFound();

            if (request.Name != null)
                template.Name = request.Name;
            if (request.Description != null)
                template.Description = request.Description;
            if (request.Sections != null)
                template.Sections = request.Sections;

            template.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return Ok(new
            {
                id = template.Id,
                name = template.Name,
                description = template.Description,
                ownerType = template.OwnerType,
                ownerId = template.OwnerId,
                tenantId = template.TenantId,
                sections = template.Sections,
                createdAt = template.CreatedAt,
                updatedAt = template.UpdatedAt
            });
        }

        /// <summary>
        /// DELETE /soa-templates/{id}
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var template = await _db.SoaTemplates.FindAsync(id);
            if (template == null)
                return NotFound();

            // Prevent deleting the PrimeSolve Default template
            if (template.Name == "PrimeSolve Default" && template.OwnerType == 0)
                return BadRequest(new { error = "Cannot delete the PrimeSolve Default template." });

            _db.SoaTemplates.Remove(template);
            await _db.SaveChangesAsync();

            return Ok(new { deleted = true });
        }

        /// <summary>
        /// POST /soa-templates/{id}/duplicate — duplicate a template.
        /// </summary>
        [HttpPost("{id}/duplicate")]
        public async Task<IActionResult> Duplicate(Guid id, [FromBody] DuplicateSoaTemplateRequest request)
        {
            var tenantId = GetTenantId();
            if (tenantId == Guid.Empty)
                return Unauthorized(new { error = "Tenant ID not found in token." });

            var source = await _db.SoaTemplates.FindAsync(id);
            if (source == null)
                return NotFound();

            var now = DateTime.UtcNow;
            var duplicate = new SoaTemplate
            {
                Id = Guid.NewGuid(),
                Name = request.Name ?? $"{source.Name} (Copy)",
                Description = source.Description,
                OwnerType = request.OwnerType,
                OwnerId = request.OwnerId,
                TenantId = tenantId,
                Sections = source.Sections,
                CreatedAt = now,
                UpdatedAt = now
            };

            _db.SoaTemplates.Add(duplicate);
            await _db.SaveChangesAsync();

            return Ok(new
            {
                id = duplicate.Id,
                name = duplicate.Name,
                description = duplicate.Description,
                ownerType = duplicate.OwnerType,
                ownerId = duplicate.OwnerId,
                tenantId = duplicate.TenantId,
                sections = duplicate.Sections,
                createdAt = duplicate.CreatedAt,
                updatedAt = duplicate.UpdatedAt
            });
        }

        /// <summary>
        /// POST /soa-templates/{id}/share — share a template.
        /// PlatformAdmin can share Global Admin (OwnerType=0) templates.
        /// TenantAdmin can share Advice Group (OwnerType=1) templates.
        /// </summary>
        [HttpPost("{id}/share")]
        public async Task<IActionResult> Share(Guid id, [FromBody] ShareSoaTemplateRequest request)
        {
            var tenantId = GetTenantId();
            if (tenantId == Guid.Empty)
                return Unauthorized(new { error = "Tenant ID not found in token." });

            var role = GetRole();
            var template = await _db.SoaTemplates.FindAsync(id);
            if (template == null)
                return NotFound();

            // Authorization: PlatformAdmin for admin templates, TenantAdmin for advice group templates
            if (template.OwnerType == 0)
            {
                if (!string.Equals(role, "PlatformAdmin", StringComparison.OrdinalIgnoreCase))
                    return Forbid();
            }
            else if (template.OwnerType == 1)
            {
                if (!string.Equals(role, "TenantAdmin", StringComparison.OrdinalIgnoreCase)
                    && !string.Equals(role, "PlatformAdmin", StringComparison.OrdinalIgnoreCase))
                    return Forbid();

                if (template.TenantId != tenantId
                    && !string.Equals(role, "PlatformAdmin", StringComparison.OrdinalIgnoreCase))
                    return Forbid();
            }
            else
            {
                return BadRequest(new { error = "Only Global Admin or Advice Group templates can be shared." });
            }

            // Check for existing share record
            var existing = await _db.SoaTemplateShares
                .FirstOrDefaultAsync(s =>
                    s.TemplateId == id &&
                    s.SharedToTenantId == request.SharedToTenantId);

            if (existing != null)
            {
                // If it was hidden, un-hide it
                if (existing.IsHidden)
                {
                    existing.IsHidden = false;
                    await _db.SaveChangesAsync();
                }
                return Ok(new
                {
                    id = existing.Id,
                    templateId = existing.TemplateId,
                    sharedByTenantId = existing.SharedByTenantId,
                    sharedToTenantId = existing.SharedToTenantId,
                    isHidden = existing.IsHidden,
                    createdAt = existing.CreatedAt
                });
            }

            var share = new SoaTemplateShare
            {
                Id = Guid.NewGuid(),
                TemplateId = id,
                SharedByTenantId = tenantId,
                SharedToTenantId = request.SharedToTenantId,
                IsHidden = false,
                CreatedAt = DateTime.UtcNow
            };

            _db.SoaTemplateShares.Add(share);
            await _db.SaveChangesAsync();

            return Ok(new
            {
                id = share.Id,
                templateId = share.TemplateId,
                sharedByTenantId = share.SharedByTenantId,
                sharedToTenantId = share.SharedToTenantId,
                isHidden = share.IsHidden,
                createdAt = share.CreatedAt
            });
        }

        /// <summary>
        /// DELETE /soa-templates/{id}/share — unshare a template or hide it.
        /// For Advice Groups hiding a Global Admin template, sets IsHidden=true.
        /// Otherwise removes the share record.
        /// </summary>
        [HttpDelete("{id}/share")]
        public async Task<IActionResult> Unshare(Guid id, [FromQuery] Guid? sharedToTenantId)
        {
            var tenantId = GetTenantId();
            if (tenantId == Guid.Empty)
                return Unauthorized(new { error = "Tenant ID not found in token." });

            var role = GetRole();
            var template = await _db.SoaTemplates.FindAsync(id);
            if (template == null)
                return NotFound();

            // Advice Group hiding a Global Admin template
            if (template.OwnerType == 0
                && (string.Equals(role, "TenantAdmin", StringComparison.OrdinalIgnoreCase)))
            {
                // Find or create a share record for this tenant and mark as hidden
                var shareRecord = await _db.SoaTemplateShares
                    .FirstOrDefaultAsync(s =>
                        s.TemplateId == id && s.SharedToTenantId == tenantId);

                if (shareRecord != null)
                {
                    shareRecord.IsHidden = true;
                }
                else
                {
                    shareRecord = new SoaTemplateShare
                    {
                        Id = Guid.NewGuid(),
                        TemplateId = id,
                        SharedByTenantId = tenantId,
                        SharedToTenantId = tenantId,
                        IsHidden = true,
                        CreatedAt = DateTime.UtcNow
                    };
                    _db.SoaTemplateShares.Add(shareRecord);
                }

                await _db.SaveChangesAsync();
                return Ok(new { hidden = true });
            }

            // PlatformAdmin removing a share, or TenantAdmin removing their own share
            var targetTenantId = sharedToTenantId;

            var share = await _db.SoaTemplateShares
                .FirstOrDefaultAsync(s =>
                    s.TemplateId == id &&
                    s.SharedToTenantId == targetTenantId);

            if (share == null)
                return NotFound(new { error = "Share record not found." });

            // Only the original sharer (or PlatformAdmin) can remove a share
            if (share.SharedByTenantId != tenantId
                && !string.Equals(role, "PlatformAdmin", StringComparison.OrdinalIgnoreCase))
                return Forbid();

            _db.SoaTemplateShares.Remove(share);
            await _db.SaveChangesAsync();

            return Ok(new { deleted = true });
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

        private string GetRole()
        {
            var claim = User.FindFirst("role") ?? User.FindFirst(ClaimTypes.Role);
            return claim?.Value ?? string.Empty;
        }
    }

    // ── Request DTOs ────────────────────────────────────────────

    public class CreateSoaTemplateRequest
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int OwnerType { get; set; }
        public string? OwnerId { get; set; }
        public string? Sections { get; set; }
    }

    public class UpdateSoaTemplateRequest
    {
        public string? Name { get; set; }
        public string? Description { get; set; }
        public string? Sections { get; set; }
    }

    public class DuplicateSoaTemplateRequest
    {
        public string? Name { get; set; }
        public int OwnerType { get; set; }
        public string? OwnerId { get; set; }
    }

    public class ShareSoaTemplateRequest
    {
        public Guid? SharedToTenantId { get; set; }
    }
}
