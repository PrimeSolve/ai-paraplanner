using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Text;
using System.Text.Json;

namespace PrimeSolve.Api.Controllers
{
    [ApiController]
    [Route("api/v1/copilot")]
    [Authorize]
    public class CopilotController : ControllerBase
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _configuration;

        public CopilotController(IHttpClientFactory httpClientFactory, IConfiguration configuration)
        {
            _httpClientFactory = httpClientFactory;
            _configuration = configuration;
        }

        [HttpPost("message")]
        public async Task<IActionResult> ProxyMessage([FromBody] JsonElement body)
        {
            var apiKey = _configuration["Anthropic__ApiKey"];
            if (string.IsNullOrEmpty(apiKey))
                return StatusCode(500, "Anthropic API key not configured");

            var client = _httpClientFactory.CreateClient();
            var request = new HttpRequestMessage(HttpMethod.Post, "https://api.anthropic.com/v1/messages");
            request.Headers.Add("x-api-key", apiKey);
            request.Headers.Add("anthropic-version", "2023-06-01");
            request.Content = new StringContent(body.GetRawText(), Encoding.UTF8, "application/json");

            var response = await client.SendAsync(request);
            var content = await response.Content.ReadAsStringAsync();

            return Content(content, "application/json");
        }
    }
}
