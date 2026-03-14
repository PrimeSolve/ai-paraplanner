using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PrimeSolve.Api.Data;
using PrimeSolve.Api.Services;

namespace PrimeSolve.Api.Controllers
{
    [ApiController]
    [Route("api/clients/{clientId}")]
    [Authorize]
    public class ClientSettingsController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly BlobStorageService _blobStorage;

        public ClientSettingsController(AppDbContext db, BlobStorageService blobStorage)
        {
            _db = db;
            _blobStorage = blobStorage;
        }

        [HttpGet("settings")]
        public async Task<IActionResult> GetSettings(Guid clientId)
        {
            var client = await FindAuthorizedClientAsync(clientId);
            if (client == null)
                return NotFound();

            return Ok(new ClientSettingsDto
            {
                FullName = $"{client.FirstName} {client.LastName}",
                Email = client.Email,
                PhoneNumber = client.Phone,
                ProfilePhotoUrl = client.ProfilePhotoUrl
            });
        }

        [HttpPut("settings")]
        public async Task<IActionResult> UpdateSettings(Guid clientId, [FromBody] UpdateClientSettingsRequest request)
        {
            var client = await FindAuthorizedClientAsync(clientId);
            if (client == null)
                return NotFound();

            if (request.FullName != null)
            {
                var parts = request.FullName.Trim().Split(' ', 2);
                client.FirstName = parts[0];
                client.LastName = parts.Length > 1 ? parts[1] : string.Empty;
            }

            if (request.PhoneNumber != null)
                client.Phone = request.PhoneNumber;

            await _db.SaveChangesAsync();

            return Ok(new ClientSettingsDto
            {
                FullName = $"{client.FirstName} {client.LastName}",
                Email = client.Email,
                PhoneNumber = client.Phone,
                ProfilePhotoUrl = client.ProfilePhotoUrl
            });
        }

        [HttpPost("photo")]
        public async Task<IActionResult> UploadPhoto(Guid clientId, IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { error = "No file provided." });

            if (file.Length > 5 * 1024 * 1024)
                return BadRequest(new { error = "File size must not exceed 5 MB." });

            var allowedTypes = new[] { "image/jpeg", "image/png" };
            if (!allowedTypes.Contains(file.ContentType, StringComparer.OrdinalIgnoreCase))
                return BadRequest(new { error = "Only JPEG and PNG images are allowed." });

            var client = await FindAuthorizedClientAsync(clientId);
            if (client == null)
                return NotFound();

            var tenantId = GetTenantId();

            using var stream = file.OpenReadStream();
            var photoUrl = await _blobStorage.UploadProfilePhotoAsync(
                tenantId.ToString(), clientId.ToString(), stream, file.ContentType);

            client.ProfilePhotoUrl = photoUrl;
            await _db.SaveChangesAsync();

            return Ok(new { profilePhotoUrl = photoUrl });
        }

        // ── Shared client lookup with RLS ──────────────────────────

        private async Task<Models.Client?> FindAuthorizedClientAsync(Guid clientId)
        {
            var tenantId = GetTenantId();
            if (tenantId == Guid.Empty)
                return null;

            var adviserId = GetAdviserId();
            var role = GetRole();

            var client = await _db.Clients
                .FirstOrDefaultAsync(c => c.Id == clientId && c.TenantId == tenantId);

            if (client == null)
                return null;

            bool isAdmin = string.Equals(role, "TenantAdmin", StringComparison.OrdinalIgnoreCase)
                        || string.Equals(role, "PlatformAdmin", StringComparison.OrdinalIgnoreCase);

            if (!isAdmin && adviserId != Guid.Empty && client.AdviserId != adviserId)
                return null;

            return client;
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

    // ── DTOs ────────────────────────────────────────────────────

    public class ClientSettingsDto
    {
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
        public string? ProfilePhotoUrl { get; set; }
    }

    public class UpdateClientSettingsRequest
    {
        public string? FullName { get; set; }
        public string? PhoneNumber { get; set; }
    }
}
