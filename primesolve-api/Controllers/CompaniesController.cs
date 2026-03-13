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
    [Route("api/v1/companies")]
    [Authorize]
    public class CompaniesController : ControllerBase
    {
        private readonly AppDbContext _db;

        public CompaniesController(AppDbContext db)
        {
            _db = db;
        }

        /// <summary>
        /// GET /companies?clientId={clientId}
        /// Returns all companies for a client, scoped by tenant.
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] Guid clientId)
        {
            var tenantId = GetTenantId();
            if (tenantId == Guid.Empty)
                return Unauthorized(new { error = "Tenant ID not found in token." });

            var companies = await _db.Companies
                .Where(c => c.ClientId == clientId && c.TenantId == tenantId)
                .Include(c => c.Shareholders)
                .OrderByDescending(c => c.CreatedAt)
                .Select(c => new
                {
                    id = c.Id,
                    clientId = c.ClientId,
                    tenantId = c.TenantId,
                    companyName = c.CompanyName,
                    taxRate = c.TaxRate,
                    frankingBalance = c.FrankingBalance,
                    createdAt = c.CreatedAt,
                    shareholders = c.Shareholders.Select(s => new
                    {
                        id = s.Id,
                        shareholderClientId = s.ShareholderClientId,
                        shareholderEntityId = s.ShareholderEntityId,
                        sharePercentage = s.SharePercentage
                    }).ToList()
                })
                .ToListAsync();

            return Ok(companies);
        }

        /// <summary>
        /// GET /companies/{id}
        /// Returns a single company by ID, scoped by tenant.
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var tenantId = GetTenantId();
            if (tenantId == Guid.Empty)
                return Unauthorized(new { error = "Tenant ID not found in token." });

            var company = await _db.Companies
                .Include(c => c.Shareholders)
                .FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId);

            if (company == null)
                return NotFound();

            return Ok(new
            {
                id = company.Id,
                clientId = company.ClientId,
                tenantId = company.TenantId,
                companyName = company.CompanyName,
                taxRate = company.TaxRate,
                frankingBalance = company.FrankingBalance,
                createdAt = company.CreatedAt,
                shareholders = company.Shareholders.Select(s => new
                {
                    id = s.Id,
                    shareholderClientId = s.ShareholderClientId,
                    shareholderEntityId = s.ShareholderEntityId,
                    sharePercentage = s.SharePercentage
                }).ToList()
            });
        }

        /// <summary>
        /// POST /companies
        /// Creates a new company record.
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateCompanyRequest request)
        {
            var tenantId = GetTenantId();
            if (tenantId == Guid.Empty)
                return Unauthorized(new { error = "Tenant ID not found in token." });

            var company = new Company
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                ClientId = request.ClientId,
                CompanyName = request.CompanyName,
                TaxRate = request.TaxRate,
                FrankingBalance = request.FrankingBalance,
                CreatedAt = DateTime.UtcNow
            };

            _db.Companies.Add(company);
            await _db.SaveChangesAsync();

            return Ok(new
            {
                id = company.Id,
                clientId = company.ClientId,
                tenantId = company.TenantId,
                companyName = company.CompanyName,
                taxRate = company.TaxRate,
                frankingBalance = company.FrankingBalance,
                createdAt = company.CreatedAt,
                shareholders = new object[] { }
            });
        }

        /// <summary>
        /// PUT /companies/{id}
        /// Updates an existing company record.
        /// </summary>
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateCompanyRequest request)
        {
            var tenantId = GetTenantId();
            if (tenantId == Guid.Empty)
                return Unauthorized(new { error = "Tenant ID not found in token." });

            var company = await _db.Companies
                .Include(c => c.Shareholders)
                .FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId);

            if (company == null)
                return NotFound();

            if (request.CompanyName != null) company.CompanyName = request.CompanyName;
            if (request.TaxRate.HasValue) company.TaxRate = request.TaxRate;
            if (request.FrankingBalance.HasValue) company.FrankingBalance = request.FrankingBalance;

            await _db.SaveChangesAsync();

            return Ok(new
            {
                id = company.Id,
                clientId = company.ClientId,
                tenantId = company.TenantId,
                companyName = company.CompanyName,
                taxRate = company.TaxRate,
                frankingBalance = company.FrankingBalance,
                createdAt = company.CreatedAt,
                shareholders = company.Shareholders.Select(s => new
                {
                    id = s.Id,
                    shareholderClientId = s.ShareholderClientId,
                    shareholderEntityId = s.ShareholderEntityId,
                    sharePercentage = s.SharePercentage
                }).ToList()
            });
        }

        /// <summary>
        /// DELETE /companies/{id}
        /// Deletes a company and its shareholders.
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var tenantId = GetTenantId();
            if (tenantId == Guid.Empty)
                return Unauthorized(new { error = "Tenant ID not found in token." });

            var company = await _db.Companies
                .Include(c => c.Shareholders)
                .FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId);

            if (company == null)
                return NotFound();

            _db.Companies.Remove(company);
            await _db.SaveChangesAsync();

            return NoContent();
        }

        // ── Shareholders sub-resource ───────────────────────────────

        /// <summary>
        /// POST /companies/{companyId}/shareholders
        /// Adds a shareholder to the company.
        /// </summary>
        [HttpPost("{companyId}/shareholders")]
        public async Task<IActionResult> AddShareholder(Guid companyId, [FromBody] CreateCompanyShareholderRequest request)
        {
            var tenantId = GetTenantId();
            if (tenantId == Guid.Empty)
                return Unauthorized(new { error = "Tenant ID not found in token." });

            var company = await _db.Companies
                .FirstOrDefaultAsync(c => c.Id == companyId && c.TenantId == tenantId);

            if (company == null)
                return NotFound();

            var shareholder = new CompanyShareholder
            {
                Id = Guid.NewGuid(),
                CompanyId = companyId,
                TenantId = tenantId,
                ShareholderClientId = request.ShareholderClientId,
                ShareholderEntityId = request.ShareholderEntityId,
                SharePercentage = request.SharePercentage,
                CreatedAt = DateTime.UtcNow
            };

            _db.CompanyShareholders.Add(shareholder);
            await _db.SaveChangesAsync();

            return Ok(new
            {
                id = shareholder.Id,
                shareholderClientId = shareholder.ShareholderClientId,
                shareholderEntityId = shareholder.ShareholderEntityId,
                sharePercentage = shareholder.SharePercentage
            });
        }

        /// <summary>
        /// DELETE /companies/{companyId}/shareholders/{shareholderId}
        /// Removes a shareholder from the company.
        /// </summary>
        [HttpDelete("{companyId}/shareholders/{shareholderId}")]
        public async Task<IActionResult> RemoveShareholder(Guid companyId, Guid shareholderId)
        {
            var tenantId = GetTenantId();
            if (tenantId == Guid.Empty)
                return Unauthorized(new { error = "Tenant ID not found in token." });

            var shareholder = await _db.CompanyShareholders
                .FirstOrDefaultAsync(s => s.Id == shareholderId && s.CompanyId == companyId && s.TenantId == tenantId);

            if (shareholder == null)
                return NotFound();

            _db.CompanyShareholders.Remove(shareholder);
            await _db.SaveChangesAsync();

            return NoContent();
        }

        // ── JWT claim helpers ──────────────────────────────────────

        private Guid GetTenantId()
        {
            var claim = User.FindFirst("tenant_id") ?? User.FindFirst("tenantId");
            return claim != null && Guid.TryParse(claim.Value, out var id) ? id : Guid.Empty;
        }
    }

    // ── Request DTOs ────────────────────────────────────────────

    public class CreateCompanyRequest
    {
        public Guid ClientId { get; set; }
        public string CompanyName { get; set; } = string.Empty;
        public decimal? TaxRate { get; set; }
        public decimal? FrankingBalance { get; set; }
    }

    public class UpdateCompanyRequest
    {
        public string? CompanyName { get; set; }
        public decimal? TaxRate { get; set; }
        public decimal? FrankingBalance { get; set; }
    }

    public class CreateCompanyShareholderRequest
    {
        public Guid? ShareholderClientId { get; set; }
        public Guid? ShareholderEntityId { get; set; }
        public decimal? SharePercentage { get; set; }
    }
}
