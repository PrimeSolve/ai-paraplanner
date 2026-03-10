using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PrimeSolve.Api.Data;
using PrimeSolve.Api.Models;
using PrimeSolve.Api.Services;

namespace PrimeSolve.Api.Controllers
{
    [ApiController]
    [Route("api/v1/documents")]
    [Authorize]
    public class DocumentsController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly BlobStorageService _blobStorage;
        private readonly DocumentExtractionService _extraction;

        public DocumentsController(
            AppDbContext db,
            BlobStorageService blobStorage,
            DocumentExtractionService extraction)
        {
            _db = db;
            _blobStorage = blobStorage;
            _extraction = extraction;
        }

        /// <summary>
        /// POST /documents/upload — accepts multipart file upload, saves to Azure Blob
        /// Storage, creates a Document record, and kicks off AI extraction.
        /// </summary>
        [HttpPost("upload")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> Upload(
            [FromForm] IFormFile file,
            [FromForm] string clientId,
            [FromForm] string? fileType,
            [FromForm] string? category,
            [FromForm] bool? shared)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { error = "No file provided." });

            if (!Guid.TryParse(clientId, out var clientGuid))
                return BadRequest(new { error = "Invalid clientId." });

            // Resolve tenant from authenticated user claims
            var tenantId = GetTenantId();
            if (tenantId == Guid.Empty)
                return Unauthorized(new { error = "Tenant ID not found in token." });

            var documentId = Guid.NewGuid();
            var ext = System.IO.Path.GetExtension(file.FileName).TrimStart('.');
            var blobPath = $"{tenantId}/{clientGuid}/{documentId}.{ext}";

            // Upload to Azure Blob Storage
            var blobUrl = await _blobStorage.UploadAsync(blobPath, file);

            // Create Document record
            var document = new Document
            {
                Id = documentId,
                ClientId = clientGuid,
                TenantId = tenantId,
                FileName = file.FileName,
                FileType = fileType ?? DetectFileType(file.FileName),
                BlobUrl = blobUrl,
                Status = DocumentStatus.Processing,
                UploadedAt = DateTime.UtcNow,
                SizeBytes = file.Length,
                Category = category ?? "Other",
                Shared = shared ?? false
            };

            _db.Documents.Add(document);
            await _db.SaveChangesAsync();

            // Kick off extraction in the background (fire-and-forget with error handling)
            _ = Task.Run(async () =>
            {
                try
                {
                    await _extraction.ExtractAsync(document.Id);
                }
                catch (Exception ex)
                {
                    // Log but don't crash — the document stays in Processing status
                    Console.Error.WriteLine($"Extraction failed for {document.Id}: {ex.Message}");
                }
            });

            return Ok(new
            {
                id = document.Id,
                clientId = document.ClientId,
                fileName = document.FileName,
                fileType = document.FileType,
                category = document.Category,
                blobUrl = document.BlobUrl,
                status = document.Status.ToString(),
                uploadedAt = document.UploadedAt,
                fileSize = document.SizeBytes,
                shared = document.Shared
            });
        }

        /// <summary>
        /// GET /documents?clientId={id} — returns all documents for a client.
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetByClient([FromQuery] string clientId)
        {
            if (!Guid.TryParse(clientId, out var clientGuid))
                return BadRequest(new { error = "Invalid clientId." });

            var tenantId = GetTenantId();

            var docs = await _db.Documents
                .Where(d => d.ClientId == clientGuid && d.TenantId == tenantId)
                .OrderByDescending(d => d.UploadedAt)
                .Select(d => new
                {
                    id = d.Id,
                    clientId = d.ClientId,
                    fileName = d.FileName,
                    fileType = d.FileType,
                    category = d.Category,
                    blobUrl = d.BlobUrl,
                    status = d.Status.ToString(),
                    uploadedAt = d.UploadedAt,
                    fileSize = d.SizeBytes,
                    shared = d.Shared,
                    extractedSections = d.ExtractedSectionsJson
                })
                .ToListAsync();

            return Ok(docs);
        }

        /// <summary>
        /// GET /documents/{id} — returns a single document by ID.
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var tenantId = GetTenantId();

            var doc = await _db.Documents
                .FirstOrDefaultAsync(d => d.Id == id && d.TenantId == tenantId);

            if (doc == null)
                return NotFound();

            return Ok(new
            {
                id = doc.Id,
                clientId = doc.ClientId,
                fileName = doc.FileName,
                fileType = doc.FileType,
                category = doc.Category,
                blobUrl = doc.BlobUrl,
                status = doc.Status.ToString(),
                uploadedAt = doc.UploadedAt,
                fileSize = doc.SizeBytes,
                shared = doc.Shared,
                extractedSections = doc.ExtractedSectionsJson
            });
        }

        private Guid GetTenantId()
        {
            var claim = User.FindFirst("tenant_id") ?? User.FindFirst("tenantId");
            return claim != null && Guid.TryParse(claim.Value, out var id) ? id : Guid.Empty;
        }

        private static string DetectFileType(string fileName)
        {
            var name = fileName.ToLowerInvariant();
            if (name.Contains("tax")) return "tax_return";
            if (name.Contains("payslip") || name.Contains("income")) return "income_statements";
            if (name.Contains("super")) return "super_statements";
            if (name.Contains("insurance") || name.Contains("policy")) return "insurance_policies";
            if (name.Contains("loan") || name.Contains("mortgage")) return "loan_statements";
            if (name.Contains("bank")) return "bank_statements";
            if (name.Contains("rental") || name.Contains("rent")) return "rental_statements";
            if (name.Contains("portfolio") || name.Contains("investment")) return "portfolio_reports";
            return "other";
        }
    }
}
