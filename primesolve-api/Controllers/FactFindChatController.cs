using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PrimeSolve.Api.Data;

namespace PrimeSolve.Api.Controllers
{
    [ApiController]
    [Route("api/v1/fact-finds/{factFindId}/chat")]
    [Authorize]
    public class FactFindChatController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _configuration;

        private const string AnthropicApiUrl = "https://api.anthropic.com/v1/messages";
        private const string Model = "claude-sonnet-4-20250514";

        public FactFindChatController(
            AppDbContext db,
            IHttpClientFactory httpClientFactory,
            IConfiguration configuration)
        {
            _db = db;
            _httpClientFactory = httpClientFactory;
            _configuration = configuration;
        }

        [HttpPost]
        public async Task<IActionResult> Chat(
            Guid factFindId,
            [FromBody] ChatRequest request)
        {
            var apiKey = _configuration["Anthropic:ApiKey"]
                         ?? _configuration["Anthropic__ApiKey"]
                         ?? Environment.GetEnvironmentVariable("Anthropic__ApiKey");

            if (string.IsNullOrEmpty(apiKey))
                return StatusCode(500, new { error = "Anthropic API key not configured." });

            if (!Guid.TryParse(request.ClientId, out var clientGuid))
                return BadRequest(new { error = "Invalid clientId." });

            var tenantId = GetTenantId();

            // Load all extracted documents for this client
            var documents = await _db.Documents
                .Where(d => d.ClientId == clientGuid
                         && d.TenantId == tenantId
                         && d.ExtractedSectionsJson != null)
                .Select(d => new { d.FileName, d.FileType, d.ExtractedSectionsJson })
                .ToListAsync();

            // Load client name
            var client = await _db.Clients
                .Where(c => c.Id == clientGuid && c.TenantId == tenantId)
                .Select(c => new { c.FirstName, c.LastName })
                .FirstOrDefaultAsync();

            var clientName = client != null
                ? $"{client.FirstName} {client.LastName}".Trim()
                : "the client";

            // Build extracted data summary
            var extractedDataSummary = new StringBuilder();
            foreach (var doc in documents)
            {
                extractedDataSummary.AppendLine($"--- {doc.FileName} ({doc.FileType}) ---");
                extractedDataSummary.AppendLine(doc.ExtractedSectionsJson);
                extractedDataSummary.AppendLine();
            }

            // Build system prompt
            var systemPrompt = $@"You are a friendly financial assistant helping {clientName} complete their financial fact find for their adviser.

You have reviewed their uploaded documents and found:
{extractedDataSummary}

Your job:
- Open with a friendly summary of what you found in their documents
- Walk through each section naturally in conversation
- Flag low confidence fields (below 0.85) for confirmation
- Accept corrections from the client
- When the client confirms a field or provides a correction, include it in the fieldUpdates array in your response
- Never use financial jargon — keep it simple and friendly
- Keep responses concise and conversational
- Do not repeat information the client has already confirmed

IMPORTANT: You must respond with valid JSON in exactly this format:
{{
  ""reply"": ""Your conversational message here"",
  ""fieldUpdates"": [
    {{
      ""section"": ""SectionName"",
      ""field"": ""field_name"",
      ""value"": ""the value""
    }}
  ]
}}

The fieldUpdates array should only contain fields the client has explicitly confirmed or corrected in this message.
Valid section names: Client1Profile, Client1FactFind
Valid field paths use dot notation, e.g. ""personal.first_name"", ""superannuation[0].balance"", ""insurance[0].sum_insured_life"".

If the user's message is empty, provide an opening summary of the extracted documents.
Always respond with the JSON format above — no markdown, no extra text outside the JSON.";

            // Build messages array for Claude API
            var messages = new List<object>();

            // Add conversation history
            if (request.ConversationHistory != null)
            {
                foreach (var msg in request.ConversationHistory)
                {
                    messages.Add(new { role = msg.Role, content = msg.Content });
                }
            }

            // Add current user message
            var userMessage = string.IsNullOrEmpty(request.Message)
                ? "Please give me an opening summary of what you found in my documents."
                : request.Message;
            messages.Add(new { role = "user", content = userMessage });

            // Call Claude API
            var requestBody = new
            {
                model = Model,
                max_tokens = 4096,
                system = systemPrompt,
                messages
            };

            var json = JsonSerializer.Serialize(requestBody);
            var httpRequest = new HttpRequestMessage(HttpMethod.Post, AnthropicApiUrl)
            {
                Content = new StringContent(json, Encoding.UTF8, "application/json")
            };
            httpRequest.Headers.Add("x-api-key", apiKey);
            httpRequest.Headers.Add("anthropic-version", "2023-06-01");

            var httpClient = _httpClientFactory.CreateClient();
            var response = await httpClient.SendAsync(httpRequest);
            var responseBody = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                return StatusCode((int)response.StatusCode, new
                {
                    error = "Anthropic API error",
                    details = responseBody
                });
            }

            // Parse Claude response
            using var doc = JsonDocument.Parse(responseBody);
            var textContent = doc.RootElement
                .GetProperty("content")[0]
                .GetProperty("text")
                .GetString() ?? "{}";

            // Strip code fences if present
            var cleaned = StripCodeFences(textContent);

            // Parse the structured response
            try
            {
                var chatResponse = JsonSerializer.Deserialize<ChatResponse>(cleaned, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                return Ok(chatResponse ?? new ChatResponse { Reply = textContent, FieldUpdates = new List<FieldUpdate>() });
            }
            catch
            {
                // If JSON parsing fails, return the raw text as reply
                return Ok(new ChatResponse
                {
                    Reply = textContent,
                    FieldUpdates = new List<FieldUpdate>()
                });
            }
        }

        private Guid GetTenantId()
        {
            var claim = User.FindFirst("tenant_id") ?? User.FindFirst("tenantId");
            return claim != null && Guid.TryParse(claim.Value, out var id) ? id : Guid.Empty;
        }

        private static string StripCodeFences(string text)
        {
            var trimmed = text.Trim();
            if (trimmed.StartsWith("```json"))
                trimmed = trimmed["```json".Length..];
            else if (trimmed.StartsWith("```"))
                trimmed = trimmed["```".Length..];
            if (trimmed.EndsWith("```"))
                trimmed = trimmed[..^"```".Length];
            return trimmed.Trim();
        }
    }

    public class ChatRequest
    {
        [JsonPropertyName("message")]
        public string? Message { get; set; }

        [JsonPropertyName("conversationHistory")]
        public List<ChatMessage>? ConversationHistory { get; set; }

        [JsonPropertyName("clientId")]
        public string ClientId { get; set; } = string.Empty;
    }

    public class ChatMessage
    {
        [JsonPropertyName("role")]
        public string Role { get; set; } = string.Empty;

        [JsonPropertyName("content")]
        public string Content { get; set; } = string.Empty;
    }

    public class ChatResponse
    {
        [JsonPropertyName("reply")]
        public string Reply { get; set; } = string.Empty;

        [JsonPropertyName("fieldUpdates")]
        public List<FieldUpdate> FieldUpdates { get; set; } = new();
    }

    public class FieldUpdate
    {
        [JsonPropertyName("section")]
        public string Section { get; set; } = string.Empty;

        [JsonPropertyName("field")]
        public string Field { get; set; } = string.Empty;

        [JsonPropertyName("value")]
        public object? Value { get; set; }
    }
}
