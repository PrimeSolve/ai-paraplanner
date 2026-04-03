using System;
using System.Net.Http;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using PrimeSolve.Api.Data;

namespace PrimeSolve.Api.Controllers
{
    [ApiController]
    [Route("api/v1/avatar")]
    [Authorize]
    public class AvatarSessionController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _configuration;

        public AvatarSessionController(
            AppDbContext db,
            IHttpClientFactory httpClientFactory,
            IConfiguration configuration)
        {
            _db = db;
            _httpClientFactory = httpClientFactory;
            _configuration = configuration;
        }

        // ── POST /api/v1/avatar/session ───────────────────────────
        [HttpPost("session")]
        public async Task<IActionResult> CreateSession([FromBody] CreateAvatarSessionRequest request)
        {
            if (string.IsNullOrWhiteSpace(request?.Role))
                return BadRequest(new { error = "Role is required." });

            var tenantId = GetTenantId();
            if (tenantId == Guid.Empty)
                return Unauthorized(new { error = "Invalid tenant." });

            // Look up avatar config for this role + tenant
            var config = await _db.AvatarConfigs
                .FirstOrDefaultAsync(c => c.TenantId == tenantId && c.Role == request.Role);

            if (config == null || !config.IsEnabled)
                return Ok(new { is_enabled = false });

            // For client role, check if client has already seen welcome
            if (request.Role == "client_welcome")
            {
                var client = await FindClientByEmailAsync();
                if (client == null)
                    return Ok(new { is_enabled = false });

                if (client.HasSeenWelcome)
                    return Ok(new { is_enabled = false });
            }

            // Call LiveAvatar API to create a session token
            var apiKey = _configuration["LiveAvatar:ApiKey"];
            if (string.IsNullOrEmpty(apiKey))
            {
                Console.Error.WriteLine("LiveAvatar:ApiKey not configured");
                return Ok(new { is_enabled = false });
            }

            try
            {
                var httpClient = _httpClientFactory.CreateClient();
                httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {apiKey}");

                var payload = new
                {
                    avatar_id = config.AvatarId,
                    voice_id = config.VoiceId,
                    voice_provider = config.VoiceProvider,
                    script = config.WelcomeScript
                };

                var content = new StringContent(
                    JsonSerializer.Serialize(payload),
                    Encoding.UTF8,
                    "application/json");

                var liveAvatarUrl = _configuration["LiveAvatar:BaseUrl"]
                    ?? "https://api.liveavatar.ai/v1";

                var response = await httpClient.PostAsync($"{liveAvatarUrl}/sessions", content);

                if (!response.IsSuccessStatusCode)
                {
                    var errorBody = await response.Content.ReadAsStringAsync();
                    Console.Error.WriteLine($"LiveAvatar session creation failed: {response.StatusCode} - {errorBody}");
                    return Ok(new { is_enabled = false });
                }

                var responseBody = await response.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(responseBody);
                var root = doc.RootElement;

                var sessionToken = root.TryGetProperty("session_token", out var tokenProp)
                    ? tokenProp.GetString()
                    : null;

                if (string.IsNullOrEmpty(sessionToken))
                {
                    Console.Error.WriteLine("LiveAvatar response missing session_token");
                    return Ok(new { is_enabled = false });
                }

                return Ok(new
                {
                    is_enabled = true,
                    session_token = sessionToken,
                    avatar_id = config.AvatarId
                });
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"LiveAvatar session error: {ex.Message}");
                return Ok(new { is_enabled = false });
            }
        }

        // ── GET /api/v1/avatar/config/{role} ─────────────────────
        [HttpGet("config/{role}")]
        public async Task<IActionResult> GetConfig(string role)
        {
            var tenantId = GetTenantId();
            if (tenantId == Guid.Empty)
                return Unauthorized(new { error = "Invalid tenant." });

            var config = await _db.AvatarConfigs
                .FirstOrDefaultAsync(c => c.TenantId == tenantId && c.Role == role);

            if (config == null)
                return NotFound(new { error = "Avatar config not found." });

            return Ok(new
            {
                isEnabled = config.IsEnabled,
                avatarId = config.AvatarId,
                voiceId = config.VoiceId,
                voiceProvider = config.VoiceProvider,
                welcomeScript = config.WelcomeScript
            });
        }

        // ── PUT /api/v1/avatar/config/{role} ─────────────────────
        [HttpPut("config/{role}")]
        public async Task<IActionResult> UpdateConfig(string role, [FromBody] UpdateAvatarConfigRequest request)
        {
            var tenantId = GetTenantId();
            if (tenantId == Guid.Empty)
                return Unauthorized(new { error = "Invalid tenant." });

            var userRole = GetRole();
            bool isAdmin = string.Equals(userRole, "TenantAdmin", StringComparison.OrdinalIgnoreCase)
                        || string.Equals(userRole, "PlatformAdmin", StringComparison.OrdinalIgnoreCase)
                        || string.Equals(userRole, "Adviser", StringComparison.OrdinalIgnoreCase);

            if (!isAdmin)
                return Forbid();

            var config = await _db.AvatarConfigs
                .FirstOrDefaultAsync(c => c.TenantId == tenantId && c.Role == role);

            if (config == null)
            {
                config = new Models.AvatarConfig
                {
                    TenantId = tenantId,
                    Role = role
                };
                _db.AvatarConfigs.Add(config);
            }

            config.IsEnabled = request.IsEnabled;
            config.AvatarId = request.AvatarId;
            config.VoiceId = request.VoiceId;
            config.VoiceProvider = request.VoiceProvider;
            config.WelcomeScript = request.WelcomeScript;
            config.UpdatedDate = DateTime.UtcNow;

            await _db.SaveChangesAsync();

            return Ok(new
            {
                isEnabled = config.IsEnabled,
                avatarId = config.AvatarId,
                voiceId = config.VoiceId,
                voiceProvider = config.VoiceProvider,
                welcomeScript = config.WelcomeScript
            });
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

        private string? GetRole()
        {
            var claim = User.FindFirst("role") ?? User.FindFirst(ClaimTypes.Role);
            return claim?.Value;
        }
    }

    // ── DTOs ────────────────────────────────────────────────────

    public class CreateAvatarSessionRequest
    {
        public string Role { get; set; } = string.Empty;
    }

    public class UpdateAvatarConfigRequest
    {
        public bool IsEnabled { get; set; }
        public string? AvatarId { get; set; }
        public string? VoiceId { get; set; }
        public string? VoiceProvider { get; set; }
        public string? WelcomeScript { get; set; }
    }
}
