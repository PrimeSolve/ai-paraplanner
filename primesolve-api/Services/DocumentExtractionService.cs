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
                max_tokens = 8192,
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
    ""date_of_birth"": { ""value"": """", ""confidence"": 0.0 },
    ""gender"": { ""value"": """", ""confidence"": 0.0 },
    ""marital_status"": { ""value"": """", ""confidence"": 0.0 },
    ""email"": { ""value"": """", ""confidence"": 0.0 },
    ""phone"": { ""value"": """", ""confidence"": 0.0 },
    ""address"": { ""value"": """", ""confidence"": 0.0 },
    ""suburb"": { ""value"": """", ""confidence"": 0.0 },
    ""state"": { ""value"": """", ""confidence"": 0.0 },
    ""postcode"": { ""value"": """", ""confidence"": 0.0 },
    ""employment_status"": { ""value"": """", ""confidence"": 0.0 },
    ""occupation"": { ""value"": """", ""confidence"": 0.0 },
    ""employer"": { ""value"": """", ""confidence"": 0.0 },
    ""smoker_status"": { ""value"": """", ""confidence"": 0.0 },
    ""health_status"": { ""value"": """", ""confidence"": 0.0 },
    ""has_will"": { ""value"": """", ""confidence"": 0.0 }
  },
  ""income"": {
    ""client1"": {
      ""i_type"": { ""value"": """", ""confidence"": 0.0 },
      ""i_gross"": { ""value"": """", ""confidence"": 0.0 },
      ""employer"": { ""value"": """", ""confidence"": 0.0 },
      ""i_bonus"": { ""value"": """", ""confidence"": 0.0 },
      ""i_fbt"": { ""value"": """", ""confidence"": 0.0 },
      ""i_fbt_value"": { ""value"": """", ""confidence"": 0.0 },
      ""i_increase"": { ""value"": """", ""confidence"": 0.0 },
      ""i_nontax"": { ""value"": """", ""confidence"": 0.0 },
      ""i_super_inc"": { ""value"": """", ""confidence"": 0.0 }
    },
    ""rental_income"": { ""value"": 0, ""confidence"": 0.0 }
  },
  ""superannuation"": [
    {
      ""type"": { ""value"": ""super"", ""confidence"": 0.0 },
      ""fund_name"": { ""value"": """", ""confidence"": 0.0 },
      ""provider"": { ""value"": """", ""confidence"": 0.0 },
      ""balance"": { ""value"": 0, ""confidence"": 0.0 },
      ""member_number"": { ""value"": """", ""confidence"": 0.0 },
      ""owner"": { ""value"": ""client1"", ""confidence"": 0.0 },
      ""super_guarantee"": { ""value"": """", ""confidence"": 0.0 },
      ""salary_sacrifice"": { ""value"": """", ""confidence"": 0.0 },
      ""after_tax"": { ""value"": """", ""confidence"": 0.0 }
    }
  ],
  ""insurance"": [
    {
      ""pol_name"": { ""value"": """", ""confidence"": 0.0 },
      ""pol_type"": { ""value"": """", ""confidence"": 0.0 },
      ""pol_tax_env"": { ""value"": """", ""confidence"": 0.0 },
      ""pol_owner"": { ""value"": """", ""confidence"": 0.0 },
      ""pol_insured"": { ""value"": """", ""confidence"": 0.0 },
      ""pol_provider"": { ""value"": """", ""confidence"": 0.0 },
      ""pol_number"": { ""value"": """", ""confidence"": 0.0 },
      ""pol_waiting"": { ""value"": """", ""confidence"": 0.0 },
      ""pol_benefit_period"": { ""value"": """", ""confidence"": 0.0 },
      ""sum_insured_life"": { ""value"": """", ""confidence"": 0.0 },
      ""sum_insured_tpd"": { ""value"": """", ""confidence"": 0.0 },
      ""sum_insured_trauma"": { ""value"": """", ""confidence"": 0.0 },
      ""sum_insured_ip"": { ""value"": """", ""confidence"": 0.0 },
      ""premium_life"": { ""value"": """", ""confidence"": 0.0 },
      ""premium_tpd"": { ""value"": """", ""confidence"": 0.0 },
      ""premium_trauma"": { ""value"": """", ""confidence"": 0.0 },
      ""premium_ip"": { ""value"": """", ""confidence"": 0.0 },
      ""pol_freq"": { ""value"": """", ""confidence"": 0.0 },
      ""pol_structure"": { ""value"": """", ""confidence"": 0.0 }
    }
  ],
  ""assets"": [
    {
      ""a_name"": { ""value"": """", ""confidence"": 0.0 },
      ""a_description"": { ""value"": """", ""confidence"": 0.0 },
      ""a_type"": { ""value"": """", ""confidence"": 0.0 },
      ""a_value"": { ""value"": """", ""confidence"": 0.0 },
      ""a_owner"": { ""value"": """", ""confidence"": 0.0 },
      ""a_address"": { ""value"": """", ""confidence"": 0.0 },
      ""a_purchase_price"": { ""value"": """", ""confidence"": 0.0 },
      ""a_rental_income"": { ""value"": """", ""confidence"": 0.0 }
    }
  ],
  ""liabilities"": [
    {
      ""d_name"": { ""value"": """", ""confidence"": 0.0 },
      ""d_type"": { ""value"": """", ""confidence"": 0.0 },
      ""lender"": { ""value"": """", ""confidence"": 0.0 },
      ""d_balance"": { ""value"": """", ""confidence"": 0.0 },
      ""d_repayments"": { ""value"": """", ""confidence"": 0.0 },
      ""d_rate"": { ""value"": """", ""confidence"": 0.0 },
      ""d_owner"": { ""value"": """", ""confidence"": 0.0 }
    }
  ],
  ""dependants"": [
    {
      ""name"": { ""value"": """", ""confidence"": 0.0 },
      ""date_of_birth"": { ""value"": """", ""confidence"": 0.0 },
      ""dep_type"": { ""value"": ""child"", ""confidence"": 0.0 },
      ""relationship"": { ""value"": """", ""confidence"": 0.0 },
      ""financially_dependent"": { ""value"": """", ""confidence"": 0.0 }
    }
  ],
  ""trusts_companies"": [
    {
      ""type"": { ""value"": ""trust"", ""confidence"": 0.0 },
      ""trust_name"": { ""value"": """", ""confidence"": 0.0 },
      ""trust_type"": { ""value"": """", ""confidence"": 0.0 },
      ""trust_abn"": { ""value"": """", ""confidence"": 0.0 },
      ""company_name"": { ""value"": """", ""confidence"": 0.0 },
      ""company_abn"": { ""value"": """", ""confidence"": 0.0 }
    }
  ],
  ""smsf"": [
    {
      ""smsf_name"": { ""value"": """", ""confidence"": 0.0 },
      ""smsf_abn"": { ""value"": """", ""confidence"": 0.0 },
      ""smsf_balance"": { ""value"": """", ""confidence"": 0.0 },
      ""fund_type"": { ""value"": """", ""confidence"": 0.0 },
      ""trustee_type"": { ""value"": """", ""confidence"": 0.0 },
      ""accounts"": [
        {
          ""owner"": { ""value"": """", ""confidence"": 0.0 },
          ""balance"": { ""value"": """", ""confidence"": 0.0 },
          ""tax_environment"": { ""value"": """", ""confidence"": 0.0 },
          ""super_guarantee"": { ""value"": """", ""confidence"": 0.0 },
          ""salary_sacrifice"": { ""value"": """", ""confidence"": 0.0 }
        }
      ]
    }
  ],
  ""investments"": [
    {
      ""inv_type"": { ""value"": ""wrap"", ""confidence"": 0.0 },
      ""platform_name"": { ""value"": """", ""confidence"": 0.0 },
      ""product_name"": { ""value"": """", ""confidence"": 0.0 },
      ""owner"": { ""value"": """", ""confidence"": 0.0 },
      ""account_number"": { ""value"": """", ""confidence"": 0.0 },
      ""balance"": { ""value"": """", ""confidence"": 0.0 }
    }
  ],
  ""super_tax"": {
    ""client"": {
      ""tbc_used"": { ""value"": """", ""confidence"": 0.0 },
      ""tbc_used_amt"": { ""value"": """", ""confidence"": 0.0 },
      ""cc_used"": { ""value"": """", ""confidence"": 0.0 },
      ""div293"": { ""value"": """", ""confidence"": 0.0 },
      ""pre_losses"": { ""value"": """", ""confidence"": 0.0 },
      ""pre_cgt_losses"": { ""value"": """", ""confidence"": 0.0 }
    },
    ""partner"": {
      ""tbc_used"": { ""value"": """", ""confidence"": 0.0 },
      ""tbc_used_amt"": { ""value"": """", ""confidence"": 0.0 },
      ""cc_used"": { ""value"": """", ""confidence"": 0.0 },
      ""div293"": { ""value"": """", ""confidence"": 0.0 },
      ""pre_losses"": { ""value"": """", ""confidence"": 0.0 },
      ""pre_cgt_losses"": { ""value"": """", ""confidence"": 0.0 }
    }
  }
}";

            var typeSpecificInstructions = fileType switch
            {
                "tax_return" => @"This is a tax return document. Focus on extracting:
- Personal details (name, DOB, address, suburb, state, postcode, phone, email, occupation, employer)
- Income details (gross salary, income type, bonus, fringe benefits, non-taxable income)
- Rental income and investment property details (address, value, rental income)
- Capital gains tax losses, prior year losses
- Any dependants listed
- Superannuation contributions (employer, salary sacrifice)",

                "super_statements" => @"This is a superannuation statement. Focus on extracting:
- Fund name, provider, and ABN
- Member number
- Current balance
- Account type (super, pension, or annuity)
- Insurance held within super (life cover, TPD, income protection — sum insured, premiums)
- Employer contributions, salary sacrifice, after-tax contributions
- SMSF details if applicable (fund name, ABN, trustee type, member accounts)
- Transfer balance cap (TBC) usage if shown",

                "income_statements" or "payslip" => @"This is a payslip or income statement. Focus on extracting:
- Employee name, address, and details
- Employer name
- Gross salary/wages (annualise if needed)
- Income type (employment, business, etc.)
- Super guarantee contributions and salary sacrifice
- Fringe benefits and their value
- Tax withheld
- Bonus income",

                "insurance_policies" => @"This is an insurance policy document. Focus on extracting:
- Policy name and number
- Policy type code: 1=Life, 2=Life+TPD, 3=Life+Trauma, 4=Life+TPD+Trauma, 5=TPD, 6=Trauma, 7=Trauma+TPD, 8=Income Protection
- Tax environment (super or personal)
- Policy owner and insured person
- Provider/insurer name
- Sum insured for each cover type (life, TPD, trauma, IP) — use separate fields
- Premium for each cover type (life, TPD, trauma, IP) — use separate fields
- Premium frequency: 1=Weekly, 2=Fortnightly, 3=Monthly, 4=Quarterly, 5=Half-yearly, 6=Annual
- Premium structure: 1=Stepped, 2=Level, 3=Hybrid
- Waiting period and benefit period (for income protection)",

                "loan_statements" => @"This is a loan statement. Focus on extracting:
- Lender name
- Loan/debt type: 1=Home loan, 2=Investment loan, 3=Margin loan, 5=Credit card, 6=Reverse mortgage, 7=Car loan, 8=Other
- Outstanding balance
- Regular repayment amount
- Interest rate
- Property address if applicable (populate assets section too)
- Property value if shown
- Borrower/owner name",

                "bank_statements" => @"This is a bank statement. Focus on extracting:
- Account holder name and address
- Bank/institution name
- Account balance (add as asset)
- Regular income deposits (salary — extract gross amount and employer)
- Regular loan repayments (extract as liabilities)
- Any investment or rental income",

                "rental_statements" => @"This is a rental statement. Focus on extracting:
- Property address (populate assets section)
- Property value if shown
- Rental income amount
- Property owner details
- Any associated mortgage/loan details (populate liabilities)
- Property management fees and expenses",

                "portfolio_reports" => @"This is a portfolio/investment report. Focus on extracting:
- Platform/wrap provider name
- Product name
- Total portfolio value / balance
- Account number
- Investment type (wrap or bond)
- Account holder/owner details
- Individual holdings if visible",

                "centrelink" => @"This is a Centrelink or social security document. Focus on extracting:
- Recipient name and details
- Benefit type and amount
- Any asset or income test details
- Dependant information
- Any superannuation or investment balances listed",

                _ => @"This is a financial document. Extract ALL relevant information into the appropriate sections:
- Personal details (name, DOB, address, contact, employment)
- Income (salary, business, investment, rental)
- Superannuation (fund details, balances, contributions)
- Insurance policies (type, cover amounts, premiums)
- Assets (properties, cash, investments)
- Liabilities (loans, debts, credit cards)
- Dependants (names, DOBs, relationships)
- Trusts & companies (names, ABNs, types)
- SMSF details (fund name, ABN, member accounts)
- Investment platforms (wraps, bonds, balances)
- Super & tax details (TBC, CGT losses)"
            };

            return $@"You are a financial document extraction assistant for Australian financial planning.

Analyze the uploaded document and extract structured data into the JSON schema below.

{typeSpecificInstructions}

IMPORTANT RULES:
1. Return ONLY valid JSON matching this exact schema structure — no markdown, no explanation.
2. Return ALL sections where you find relevant data. A single document may populate multiple sections.
3. Each extracted field MUST use the {{ ""value"": ..., ""confidence"": 0.0-1.0 }} wrapper:
   - 1.0 = clearly stated in the document
   - 0.8-0.99 = high confidence, minor interpretation needed
   - 0.5-0.79 = moderate confidence, some ambiguity
   - Below 0.5 = low confidence, significant interpretation
4. For array sections (superannuation, insurance, assets, liabilities, dependants, trusts_companies, smsf, investments), return an array of objects — one per entry found.
5. For monetary values, use plain numbers as strings without currency symbols or commas (e.g. ""150000"" not ""$150,000"").
6. For dates, use ISO format (YYYY-MM-DD).
7. If a field is not found in the document, omit it entirely from the output.
8. Do not include empty sections or empty arrays.
9. For owner fields, use ""client1"" for the primary person and ""client2"" for partner/spouse.
10. For insurance pol_type, use the numeric code: 1=Life, 2=Life+TPD, 3=Life+Trauma, 4=Life+TPD+Trauma, 5=TPD, 6=Trauma, 7=Trauma+TPD, 8=Income Protection.
11. For dep_type, use ""child"" for children or ""dependant"" for other dependants.
12. For trust/company type, use ""trust"" or ""company"".
13. For investment inv_type, use ""wrap"" or ""bond"".

JSON Schema:
{schemaJson}

Return ONLY the JSON object with populated sections. Do not include empty sections.";
        }
    }
}
