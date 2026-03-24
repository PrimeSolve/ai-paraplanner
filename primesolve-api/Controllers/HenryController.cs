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
    [Route("api/v1/henry")]
    [Authorize]
    public class HenryController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _configuration;

        private const string AnthropicApiUrl = "https://api.anthropic.com/v1/messages";
        private const string Model = "claude-sonnet-4-20250514";
        private const int MaxTokens = 1024;

        public HenryController(
            AppDbContext db,
            IHttpClientFactory httpClientFactory,
            IConfiguration configuration)
        {
            _db = db;
            _httpClientFactory = httpClientFactory;
            _configuration = configuration;
        }

        [HttpPost("chat")]
        public async Task<IActionResult> Chat([FromBody] HenryChatRequest request)
        {
            var apiKey = _configuration["Anthropic:ApiKey"]
                         ?? _configuration["Anthropic__ApiKey"]
                         ?? Environment.GetEnvironmentVariable("Anthropic__ApiKey");

            if (string.IsNullOrEmpty(apiKey))
                return StatusCode(500, new { error = "Anthropic API key not configured." });

            var tenantId = GetTenantId();

            if (request.Version == "client")
                return await HandleClientHenry(apiKey, request, tenantId);

            return await HandleAdviserHenry(apiKey, request, tenantId);
        }

        // ─────────────────────────────────────────────────
        // ADVISER HENRY — full co-pilot with tools
        // ─────────────────────────────────────────────────

        private async Task<IActionResult> HandleAdviserHenry(string apiKey, HenryChatRequest request, Guid tenantId)
        {
            // Resolve adviser name from the user's JWT claims
            var adviserName = User.FindFirst("name")?.Value
                              ?? User.FindFirst("preferred_username")?.Value
                              ?? "Adviser";

            // Resolve advice group name from tenant
            var adviceGroupName = "your advice group";
            if (tenantId != Guid.Empty)
            {
                var tenant = await _db.Tenants
                    .Where(t => t.Id == tenantId)
                    .Select(t => new { t.Name })
                    .FirstOrDefaultAsync();
                if (tenant != null)
                    adviceGroupName = tenant.Name;
            }

            Guid? adviserGuid = null;
            if (!string.IsNullOrEmpty(request.AdviserId) && Guid.TryParse(request.AdviserId, out var aGuid))
                adviserGuid = aGuid;

            var systemPrompt = $@"You are Henry, the AI co-pilot for AI Paraplanner — a platform for Australian financial advisers. You are assisting adviser {adviserName} from {adviceGroupName}. The adviser is currently on page: {request.CurrentPage}.

You can help with:
- Navigating to pages on the platform
- Loading or adding clients
- Creating tasks and support tickets
- Answering questions about the adviser's SOA pipeline, client counts, and task data
- Answering general questions about the cashflow modelling capabilities
- Answering how-to questions about the platform

Always be concise, professional, and action-oriented.

When performing an action, confirm what you're about to do before doing it. When answering data questions, always state the source (e.g. ""Based on your current SOA queue...""). For cashflow model questions, provide general guidance only — client-specific data requires opening the client's model directly.";

            var tools = GetAdviserTools();

            var response = await CallClaudeWithTools(apiKey, systemPrompt, request.Messages, tools, adviserGuid, tenantId);
            return Ok(response);
        }

        // ─────────────────────────────────────────────────
        // CLIENT HENRY — informational only, no tools
        // ─────────────────────────────────────────────────

        private async Task<IActionResult> HandleClientHenry(string apiKey, HenryChatRequest request, Guid tenantId)
        {
            var clientName = "there";

            if (!string.IsNullOrEmpty(request.ClientId) && Guid.TryParse(request.ClientId, out var cGuid))
            {
                var client = await _db.Clients
                    .Where(c => c.Id == cGuid && c.TenantId == tenantId)
                    .Select(c => new { c.FirstName })
                    .FirstOrDefaultAsync();

                if (client != null)
                    clientName = client.FirstName;
            }

            // TODO: client Henry — expand capabilities when client portal is fuller
            var systemPrompt = $@"You are Henry, a friendly AI assistant for AI Paraplanner. You are helping client {clientName} understand how to use the platform.

You can only help with:
- How to complete the fact find (section by section guidance)
- How to upload and pre-fill documents
- General questions about what the client portal can do
- Explaining what information is needed and why

You cannot access account data, make changes, or perform any actions. Always be warm, simple, and encouraging. Avoid financial jargon. If asked anything outside your scope, politely redirect:

""For that, you'll need to speak directly with your adviser.""";

            var messages = new List<object>();
            if (request.Messages != null)
            {
                foreach (var msg in request.Messages)
                    messages.Add(new { role = msg.Role, content = msg.Content });
            }

            var requestBody = new
            {
                model = Model,
                max_tokens = MaxTokens,
                system = systemPrompt,
                messages
            };

            var replyText = await SendAnthropicRequest(apiKey, requestBody);
            return Ok(new { reply = replyText });
        }

        // ─────────────────────────────────────────────────
        // Claude tool use loop
        // ─────────────────────────────────────────────────

        private async Task<object> CallClaudeWithTools(
            string apiKey,
            string systemPrompt,
            List<HenryChatMessage>? chatMessages,
            List<object> tools,
            Guid? adviserId,
            Guid tenantId)
        {
            var messages = new List<object>();
            if (chatMessages != null)
            {
                foreach (var msg in chatMessages)
                    messages.Add(new { role = msg.Role, content = msg.Content });
            }

            const int maxIterations = 5;
            string? navigatePage = null;

            for (var i = 0; i < maxIterations; i++)
            {
                var requestBody = new
                {
                    model = Model,
                    max_tokens = MaxTokens,
                    system = systemPrompt,
                    messages,
                    tools
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
                    return new { reply = "Sorry, I encountered an error. Please try again.", error = responseBody };

                using var doc = JsonDocument.Parse(responseBody);
                var root = doc.RootElement;
                var stopReason = root.GetProperty("stop_reason").GetString();
                var content = root.GetProperty("content");

                var textParts = new List<string>();
                var toolUseBlocks = new List<JsonElement>();

                foreach (var block in content.EnumerateArray())
                {
                    var type = block.GetProperty("type").GetString();
                    if (type == "text")
                        textParts.Add(block.GetProperty("text").GetString() ?? "");
                    else if (type == "tool_use")
                        toolUseBlocks.Add(block.Clone());
                }

                if (stopReason != "tool_use" || toolUseBlocks.Count == 0)
                {
                    var reply = string.Join("\n", textParts);
                    if (navigatePage != null)
                        return new { reply, action = "navigate", page = navigatePage };
                    return new { reply };
                }

                // Add assistant's response (with tool_use blocks) to messages
                var assistantContent = new List<object>();
                foreach (var block in content.EnumerateArray())
                {
                    var type = block.GetProperty("type").GetString();
                    if (type == "text")
                        assistantContent.Add(new { type = "text", text = block.GetProperty("text").GetString() });
                    else if (type == "tool_use")
                    {
                        assistantContent.Add(new
                        {
                            type = "tool_use",
                            id = block.GetProperty("id").GetString(),
                            name = block.GetProperty("name").GetString(),
                            input = JsonSerializer.Deserialize<object>(block.GetProperty("input").GetRawText())
                        });
                    }
                }
                messages.Add(new { role = "assistant", content = assistantContent });

                // Execute each tool and build tool results
                var toolResults = new List<object>();
                foreach (var toolBlock in toolUseBlocks)
                {
                    var toolId = toolBlock.GetProperty("id").GetString()!;
                    var toolName = toolBlock.GetProperty("name").GetString()!;
                    var toolInput = toolBlock.GetProperty("input");

                    var result = await ExecuteTool(toolName, toolInput, adviserId, tenantId);

                    if (toolName == "navigate_to_page")
                        navigatePage = toolInput.TryGetProperty("page", out var p) ? p.GetString() : null;

                    toolResults.Add(new
                    {
                        type = "tool_result",
                        tool_use_id = toolId,
                        content = result
                    });
                }

                messages.Add(new { role = "user", content = toolResults });
            }

            return new { reply = "I processed your request but reached the maximum number of steps. Please try again with a simpler question." };
        }

        // ─────────────────────────────────────────────────
        // Tool execution
        // ─────────────────────────────────────────────────

        private async Task<string> ExecuteTool(string toolName, JsonElement input, Guid? adviserId, Guid tenantId)
        {
            try
            {
                return toolName switch
                {
                    "navigate_to_page" => ExecuteNavigate(input),
                    "search_clients" => await ExecuteSearchClients(input, adviserId, tenantId),
                    "get_soa_stats" => await ExecuteGetSoaStats(adviserId, tenantId),
                    "get_task_stats" => ExecuteGetTaskStats(),
                    "create_task" => ExecuteCreateTask(input),
                    "create_support_ticket" => ExecuteCreateSupportTicket(input),
                    "get_client_count" => await ExecuteGetClientCount(adviserId, tenantId),
                    _ => $"Unknown tool: {toolName}"
                };
            }
            catch (Exception ex)
            {
                return $"Error executing {toolName}: {ex.Message}";
            }
        }

        private string ExecuteNavigate(JsonElement input)
        {
            var page = input.TryGetProperty("page", out var p) ? p.GetString() : "AdviserDashboard";
            return $"Navigating to {page}.";
        }

        private async Task<string> ExecuteSearchClients(JsonElement input, Guid? adviserId, Guid tenantId)
        {
            var query = input.TryGetProperty("query", out var q) ? q.GetString() ?? "" : "";

            var clientsQuery = _db.Clients.Where(c => c.TenantId == tenantId);
            if (adviserId.HasValue)
                clientsQuery = clientsQuery.Where(c => c.AdviserId == adviserId.Value);

            if (!string.IsNullOrEmpty(query))
            {
                var lowerQuery = query.ToLower();
                clientsQuery = clientsQuery.Where(c =>
                    (c.FirstName != null && c.FirstName.ToLower().Contains(lowerQuery)) ||
                    (c.LastName != null && c.LastName.ToLower().Contains(lowerQuery)));
            }

            var clients = await clientsQuery
                .Select(c => new { c.Id, c.FirstName, c.LastName, c.Email })
                .Take(10)
                .ToListAsync();

            if (clients.Count == 0)
                return "No clients found matching that search.";

            var lines = clients.Select(c => $"- {c.FirstName} {c.LastName} (ID: {c.Id}, Email: {c.Email})");
            return $"Found {clients.Count} client(s):\n{string.Join("\n", lines)}";
        }

        private async Task<string> ExecuteGetSoaStats(Guid? adviserId, Guid tenantId)
        {
            // Use AdviceRecords table for SOA stats (RecordType indicates record kind)
            var query = _db.AdviceRecords.Where(a => a.TenantId == tenantId);
            if (adviserId.HasValue)
                query = query.Where(a => a.AdviserId == adviserId.Value);

            var total = await query.CountAsync();
            var soaRecords = await query
                .GroupBy(a => a.RecordType)
                .Select(g => new { Type = g.Key, Count = g.Count() })
                .ToListAsync();

            var parts = new List<string> { $"Total advice records: {total}" };
            foreach (var group in soaRecords)
                parts.Add($"- {group.Type}: {group.Count}");

            return string.Join("\n", parts);
        }

        private string ExecuteGetTaskStats()
        {
            // TODO: wire to tasks table when it exists
            return "Task statistics are not yet available. The tasks feature is coming soon.";
        }

        private string ExecuteCreateTask(JsonElement input)
        {
            // TODO: wire to tasks table when it exists
            var title = input.TryGetProperty("title", out var t) ? t.GetString() ?? "Untitled" : "Untitled";
            var type = input.TryGetProperty("type", out var tp) ? tp.GetString() ?? "Other" : "Other";
            return $"Task creation is not yet available via Henry. Please create the task \"{title}\" ({type}) manually from the Tasks page. This feature is coming soon.";
        }

        private string ExecuteCreateSupportTicket(JsonElement input)
        {
            // TODO: wire to tickets table when it exists
            var subject = input.TryGetProperty("subject", out var s) ? s.GetString() ?? "" : "";
            return $"Support ticket creation is not yet available via Henry. Please create the ticket \"{subject}\" manually from the Support page. This feature is coming soon.";
        }

        private async Task<string> ExecuteGetClientCount(Guid? adviserId, Guid tenantId)
        {
            var query = _db.Clients.Where(c => c.TenantId == tenantId);
            if (adviserId.HasValue)
                query = query.Where(c => c.AdviserId == adviserId.Value);

            var count = await query.CountAsync();
            return $"Total clients: {count}";
        }

        // ─────────────────────────────────────────────────
        // Tool definitions for Adviser Henry
        // ─────────────────────────────────────────────────

        private static List<object> GetAdviserTools()
        {
            return new List<object>
            {
                new
                {
                    name = "navigate_to_page",
                    description = "Navigate the user to a specific page on the platform",
                    input_schema = new
                    {
                        type = "object",
                        properties = new Dictionary<string, object>
                        {
                            ["page"] = new
                            {
                                type = "string",
                                description = "The page to navigate to",
                                @enum = new[] { "AdviserDashboard", "AdviserClients", "AdviserSOARequests", "AdviserAdviceHistory", "Billing", "AdviserSettings", "AdviserSupport" }
                            },
                            ["clientId"] = new
                            {
                                type = "string",
                                description = "Optional client ID if navigating to a specific client"
                            }
                        },
                        required = new[] { "page" }
                    }
                },
                new
                {
                    name = "search_clients",
                    description = "Search for clients by name",
                    input_schema = new
                    {
                        type = "object",
                        properties = new Dictionary<string, object>
                        {
                            ["query"] = new
                            {
                                type = "string",
                                description = "Client name to search for"
                            }
                        },
                        required = new[] { "query" }
                    }
                },
                new
                {
                    name = "get_soa_stats",
                    description = "Get SOA request statistics for this adviser",
                    input_schema = new
                    {
                        type = "object",
                        properties = new Dictionary<string, object>
                        {
                            ["filter"] = new
                            {
                                type = "string",
                                @enum = new[] { "all", "outstanding", "completed", "inProgress", "pending" },
                                description = "Which SOAs to count"
                            }
                        },
                        required = Array.Empty<string>()
                    }
                },
                new
                {
                    name = "get_task_stats",
                    description = "Get task statistics across all clients",
                    input_schema = new
                    {
                        type = "object",
                        properties = new Dictionary<string, object>
                        {
                            ["filter"] = new
                            {
                                type = "string",
                                @enum = new[] { "all", "overdue", "todo", "inProgress", "done" },
                                description = "Which tasks to count"
                            }
                        },
                        required = Array.Empty<string>()
                    }
                },
                new
                {
                    name = "create_task",
                    description = "Create a new task for a client",
                    input_schema = new
                    {
                        type = "object",
                        properties = new Dictionary<string, object>
                        {
                            ["clientId"] = new { type = "string" },
                            ["title"] = new { type = "string" },
                            ["type"] = new
                            {
                                type = "string",
                                @enum = new[] { "Fact Find Sent", "Fact Find Completed", "SOA Completed", "SOA Presented", "Authority to Proceed Signed", "PDS Provided", "Other" }
                            },
                            ["assignedTo"] = new
                            {
                                type = "string",
                                @enum = new[] { "Adviser", "Client" }
                            },
                            ["dueDate"] = new
                            {
                                type = "string",
                                description = "ISO date string"
                            },
                            ["notes"] = new { type = "string" }
                        },
                        required = new[] { "clientId", "title", "type" }
                    }
                },
                new
                {
                    name = "create_support_ticket",
                    description = "Create a support ticket",
                    input_schema = new
                    {
                        type = "object",
                        properties = new Dictionary<string, object>
                        {
                            ["subject"] = new { type = "string" },
                            ["category"] = new
                            {
                                type = "string",
                                @enum = new[] { "Billing", "Technical", "SOA", "Other" }
                            },
                            ["priority"] = new
                            {
                                type = "string",
                                @enum = new[] { "Low", "Medium", "High", "Urgent" }
                            },
                            ["description"] = new { type = "string" }
                        },
                        required = new[] { "subject", "category", "description" }
                    }
                },
                new
                {
                    name = "get_client_count",
                    description = "Get the total number of clients for this adviser",
                    input_schema = new
                    {
                        type = "object",
                        properties = new Dictionary<string, object>(),
                        required = Array.Empty<string>()
                    }
                }
            };
        }

        // ─────────────────────────────────────────────────
        // Helpers
        // ─────────────────────────────────────────────────

        private Guid GetTenantId()
        {
            var claim = User.FindFirst("tenant_id") ?? User.FindFirst("tenantId");
            return claim != null && Guid.TryParse(claim.Value, out var id) ? id : Guid.Empty;
        }

        private async Task<string> SendAnthropicRequest(string apiKey, object requestBody)
        {
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
                return "Sorry, I encountered an error processing your request. Please try again.";

            using var doc = JsonDocument.Parse(responseBody);
            var content = doc.RootElement.GetProperty("content");
            var textParts = new List<string>();
            foreach (var block in content.EnumerateArray())
            {
                if (block.GetProperty("type").GetString() == "text")
                    textParts.Add(block.GetProperty("text").GetString() ?? "");
            }

            return string.Join("\n", textParts);
        }
    }

    // ─────────────────────────────────────────────────
    // Request / Response models
    // ─────────────────────────────────────────────────

    public class HenryChatRequest
    {
        [JsonPropertyName("messages")]
        public List<HenryChatMessage>? Messages { get; set; }

        [JsonPropertyName("currentPage")]
        public string CurrentPage { get; set; } = "";

        [JsonPropertyName("adviserId")]
        public string? AdviserId { get; set; }

        [JsonPropertyName("clientId")]
        public string? ClientId { get; set; }

        [JsonPropertyName("version")]
        public string Version { get; set; } = "adviser";
    }

    public class HenryChatMessage
    {
        [JsonPropertyName("role")]
        public string Role { get; set; } = string.Empty;

        [JsonPropertyName("content")]
        public string Content { get; set; } = string.Empty;
    }
}
