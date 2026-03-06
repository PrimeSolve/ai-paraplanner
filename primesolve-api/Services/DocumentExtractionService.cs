using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using PrimeSolve.Api.Data;
using PrimeSolve.Api.Models;

namespace PrimeSolve.Api.Services
{
    public class DocumentExtractionService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly BlobStorageService _blobStorage;
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;
        private readonly ILogger<DocumentExtractionService> _logger;

        private const string AnthropicApiUrl = "https://api.anthropic.com/v1/messages";
        private const string Model = "claude-sonnet-4-20250514";

        public DocumentExtractionService(
            IServiceScopeFactory scopeFactory,
            BlobStorageService blobStorage,
            IHttpClientFactory httpClientFactory,
            IConfiguration configuration,
            ILogger<DocumentExtractionService> logger)
        {
            _scopeFactory = scopeFactory;
            _blobStorage = blobStorage;
            _httpClient = httpClientFactory.CreateClient("Anthropic");
            _apiKey = configuration["Anthropic:ApiKey"]
                      ?? Environment.GetEnvironmentVariable("Anthropic__ApiKey")
                      ?? throw new InvalidOperationException("Anthropic API key not configured.");
            _logger = logger;
        }

        /// <summary>
        /// Reads a document from Blob Storage, sends it to Claude for extraction,
        /// saves the extracted JSON, and updates the document status.
        /// </summary>
        public async Task<string?> ExtractAsync(Guid documentId)
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var document = await db.Documents.FindAsync(documentId);
            if (document == null)
                throw new InvalidOperationException($"Document {documentId} not found.");

            _logger.LogInformation("Starting extraction for document {Id} ({FileName})",
                document.Id, document.FileName);

            // 1. Download file bytes from Blob Storage
            var fileBytes = await _blobStorage.DownloadAsync(document.BlobUrl);
            var base64Content = Convert.ToBase64String(fileBytes);

            // 2. Determine media type for Claude API
            var mediaType = GetMediaType(document.FileName);

            // 3. Build the extraction prompt based on file type
            var prompt = BuildExtractionPrompt(document.FileType);

            // 4. Call Claude API
            var extractedJson = await CallClaudeAsync(base64Content, mediaType, prompt);

            // 5. Save results
            document.ExtractedSectionsJson = extractedJson;
            document.Status = DocumentStatus.Extracted;
            await db.SaveChangesAsync();

            _logger.LogInformation("Extraction complete for document {Id}", document.Id);

            return extractedJson;
        }

        private async Task<string> CallClaudeAsync(string base64Content, string mediaType, string prompt)
        {
            var contentList = new List<object>();

            // Add document as base64 content (image or PDF)
            if (mediaType.StartsWith("image/"))
            {
                contentList.Add(new
                {
                    type = "image",
                    source = new
                    {
                        type = "base64",
                        media_type = mediaType,
                        data = base64Content
                    }
                });
            }
            else
            {
                // For PDFs, use the document type
                contentList.Add(new
                {
                    type = "document",
                    source = new
                    {
                        type = "base64",
                        media_type = mediaType,
                        data = base64Content
                    }
                });
            }

            // Add the extraction prompt
            contentList.Add(new { type = "text", text = prompt });

            var requestBody = new
            {
                model = Model,
                max_tokens = 4096,
                messages = new[]
                {
                    new
                    {
                        role = "user",
                        content = contentList
                    }
                }
            };

            var json = JsonSerializer.Serialize(requestBody);
            var request = new HttpRequestMessage(HttpMethod.Post, AnthropicApiUrl)
            {
                Content = new StringContent(json, Encoding.UTF8, "application/json")
            };
            request.Headers.Add("x-api-key", _apiKey);
            request.Headers.Add("anthropic-version", "2023-06-01");

            var response = await _httpClient.SendAsync(request);
            var responseBody = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Claude API error {Status}: {Body}",
                    response.StatusCode, responseBody);
                throw new HttpRequestException(
                    $"Claude API returned {response.StatusCode}: {responseBody}");
            }

            // Parse the response to extract the text content
            using var doc = JsonDocument.Parse(responseBody);
            var textContent = doc.RootElement
                .GetProperty("content")[0]
                .GetProperty("text")
                .GetString();

            // Claude may wrap JSON in markdown code fences — strip them
            var cleaned = StripCodeFences(textContent ?? "{}");
            return cleaned;
        }

        private static string GetMediaType(string fileName)
        {
            var ext = System.IO.Path.GetExtension(fileName).ToLowerInvariant();
            return ext switch
            {
                ".pdf" => "application/pdf",
                ".png" => "image/png",
                ".jpg" or ".jpeg" => "image/jpeg",
                ".gif" => "image/gif",
                ".webp" => "image/webp",
                _ => "application/pdf" // Default to PDF for unknown types
            };
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

        private static string BuildExtractionPrompt(string fileType)
        {
            var schemaJson = @"{
  ""personal"": {
    ""first_name"": { ""value"": """", ""confidence"": 0.0 },
    ""last_name"": { ""value"": """", ""confidence"": 0.0 },
    ""dob"": { ""value"": """", ""confidence"": 0.0 },
    ""email"": { ""value"": """", ""confidence"": 0.0 },
    ""phone"": { ""value"": """", ""confidence"": 0.0 },
    ""address"": { ""value"": """", ""confidence"": 0.0 }
  },
  ""income"": {
    ""client1"": {
      ""gross_salary"": { ""value"": 0, ""confidence"": 0.0 },
      ""employer"": { ""value"": """", ""confidence"": 0.0 }
    },
    ""rental_income"": { ""value"": 0, ""confidence"": 0.0 }
  },
  ""superannuation"": [
    {
      ""fund_name"": { ""value"": """", ""confidence"": 0.0 },
      ""balance"": { ""value"": 0, ""confidence"": 0.0 },
      ""member_number"": { ""value"": """", ""confidence"": 0.0 },
      ""owner"": { ""value"": ""client1"", ""confidence"": 0.0 }
    }
  ],
  ""insurance"": [
    {
      ""type"": { ""value"": """", ""confidence"": 0.0 },
      ""sum_insured"": { ""value"": 0, ""confidence"": 0.0 },
      ""premium"": { ""value"": 0, ""confidence"": 0.0 },
      ""owner"": { ""value"": ""client1"", ""confidence"": 0.0 }
    }
  ],
  ""assets_liabilities"": {
    ""properties"": [],
    ""cash"": [],
    ""investments"": []
  },
  ""liabilities"": [
    {
      ""lender"": { ""value"": """", ""confidence"": 0.0 },
      ""balance"": { ""value"": 0, ""confidence"": 0.0 },
      ""repayment"": { ""value"": 0, ""confidence"": 0.0 },
      ""type"": { ""value"": """", ""confidence"": 0.0 }
    }
  ]
}";

            var typeSpecificInstructions = fileType switch
            {
                "tax_return" => @"This is a tax return document. Focus on extracting:
- Personal details (name, address, TFN if visible, DOB)
- Income details (gross salary, employer name, other income sources)
- Rental income if present
- Investment income if present
- Any deductions that indicate assets or liabilities",

                "super_statements" => @"This is a superannuation statement. Focus on extracting:
- Fund name and ABN
- Member number
- Current balance
- Insurance held within super (life, TPD, income protection)
- Employer contributions
- Investment option details",

                "income_statements" or "payslip" => @"This is a payslip or income statement. Focus on extracting:
- Employee name and details
- Employer name
- Gross salary/wages (annualise if needed)
- Super guarantee contributions
- Tax withheld",

                "insurance_policies" => @"This is an insurance policy document. Focus on extracting:
- Policy type (Life, TPD, Trauma, Income Protection)
- Sum insured / benefit amount
- Premium amount and frequency
- Policy owner
- Insurer name
- Policy number",

                "loan_statements" => @"This is a loan statement. Focus on extracting:
- Lender name
- Loan type (mortgage, personal, investment)
- Outstanding balance
- Regular repayment amount and frequency
- Interest rate
- Property address if applicable",

                "bank_statements" => @"This is a bank statement. Focus on extracting:
- Account holder name
- Bank/institution name
- Account balance
- Regular income deposits (salary)
- Regular expenses or loan repayments
- Any investment or rental income",

                "rental_statements" => @"This is a rental statement. Focus on extracting:
- Property address
- Rental income amount and frequency
- Property management fees
- Any expenses (insurance, rates, maintenance)
- Owner details",

                "portfolio_reports" => @"This is a portfolio/investment report. Focus on extracting:
- Platform/wrap provider name
- Total portfolio value
- Individual holdings and values
- Investment account type
- Account holder details",

                _ => @"This is a financial document. Extract any relevant information related to:
- Personal details
- Income
- Superannuation
- Insurance
- Assets and liabilities
- Investments"
            };

            return $@"You are a financial document extraction assistant for Australian financial planning.

Analyze the uploaded document and extract structured data into the JSON schema below.

{typeSpecificInstructions}

IMPORTANT RULES:
1. Return ONLY valid JSON matching this exact schema structure — no markdown, no explanation.
2. Only populate sections/fields where you find data in the document. Omit sections with no data.
3. Each extracted field MUST include a confidence score between 0 and 1:
   - 1.0 = clearly stated in the document
   - 0.8-0.99 = high confidence, minor interpretation needed
   - 0.5-0.79 = moderate confidence, some ambiguity
   - Below 0.5 = low confidence, significant interpretation
4. For monetary values, use numbers without currency symbols.
5. For dates, use ISO format (YYYY-MM-DD).
6. If a field is not found in the document, do not include it.

JSON Schema:
{schemaJson}

Return ONLY the JSON object with populated sections. Do not include empty sections.";
        }
    }
}
