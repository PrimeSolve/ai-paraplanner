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
    [Route("api/v1/clients/{clientId}/documents")]
    [Authorize]
    public class ClientDocumentsController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly BlobStorageService _blobStorage;
        private readonly DocumentExtractionService _extraction;

        public ClientDocumentsController(
            AppDbContext db,
            BlobStorageService blobStorage,
            DocumentExtractionService extraction)
        {
            _db = db;
            _blobStorage = blobStorage;
            _extraction = extraction;
        }

        /// <summary>
        /// GET /clients/{clientId}/documents — returns all documents for a client.
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetAll(Guid clientId)
        {
            var tenantId = GetTenantId();
            if (tenantId == Guid.Empty)
                return Unauthorized(new { error = "Tenant ID not found in token." });

            var docs = await _db.Documents
                .Where(d => d.ClientId == clientId && d.TenantId == tenantId)
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
        /// POST /clients/{clientId}/documents — upload a document for a client.
        /// </summary>
        [HttpPost]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> Upload(
            Guid clientId,
            [FromForm] IFormFile file,
            [FromForm] string? category,
            [FromForm] bool? shared)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { error = "No file provided." });

            var tenantId = GetTenantId();
            if (tenantId == Guid.Empty)
                return Unauthorized(new { error = "Tenant ID not found in token." });

            var documentId = Guid.NewGuid();
            var ext = System.IO.Path.GetExtension(file.FileName).TrimStart('.');
            var blobPath = $"{tenantId}/{clientId}/{documentId}.{ext}";

            var blobUrl = await _blobStorage.UploadAsync(blobPath, file);

            var document = new Document
            {
                Id = documentId,
                ClientId = clientId,
                TenantId = tenantId,
                FileName = file.FileName,
                FileType = DetectFileType(file.FileName),
                BlobUrl = blobUrl,
                Status = DocumentStatus.Processing,
                UploadedAt = DateTime.UtcNow,
                SizeBytes = file.Length,
                Category = category ?? "Other",
                Shared = shared ?? false
            };

            _db.Documents.Add(document);
            await _db.SaveChangesAsync();

            _ = Task.Run(async () =>
            {
                try
                {
                    await _extraction.ExtractAsync(document.Id);
                }
                catch (Exception ex)
                {
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
        /// GET /clients/{clientId}/documents/{id}/url — returns a time-limited SAS URL for viewing.
        /// </summary>
        [HttpGet("{id}/url")]
        public async Task<IActionResult> GetUrl(Guid clientId, Guid id)
        {
            var tenantId = GetTenantId();
            if (tenantId == Guid.Empty)
                return Unauthorized(new { error = "Tenant ID not found in token." });

            var doc = await _db.Documents
                .FirstOrDefaultAsync(d => d.Id == id && d.ClientId == clientId && d.TenantId == tenantId);

            if (doc == null)
                return NotFound();

            var url = _blobStorage.GetSasUrl(doc.BlobUrl, TimeSpan.FromMinutes(15));
            return Ok(new { url });
        }

        /// <summary>
        /// GET /clients/{clientId}/documents/{id}/download — downloads the document as a blob.
        /// </summary>
        [HttpGet("{id}/download")]
        public async Task<IActionResult> Download(Guid clientId, Guid id)
        {
            var tenantId = GetTenantId();
            if (tenantId == Guid.Empty)
                return Unauthorized(new { error = "Tenant ID not found in token." });

            var doc = await _db.Documents
                .FirstOrDefaultAsync(d => d.Id == id && d.ClientId == clientId && d.TenantId == tenantId);

            if (doc == null)
                return NotFound();

            var bytes = await _blobStorage.DownloadAsync(doc.BlobUrl);
            var contentType = "application/octet-stream";
            return File(bytes, contentType, doc.FileName);
        }

        /// <summary>
        /// PATCH /clients/{clientId}/documents/{id} — partial update (rename, share toggle).
        /// </summary>
        [HttpPatch("{id}")]
        public async Task<IActionResult> Patch(Guid clientId, Guid id, [FromBody] PatchDocumentRequest request)
        {
            var tenantId = GetTenantId();
            if (tenantId == Guid.Empty)
                return Unauthorized(new { error = "Tenant ID not found in token." });

            var doc = await _db.Documents
                .FirstOrDefaultAsync(d => d.Id == id && d.ClientId == clientId && d.TenantId == tenantId);

            if (doc == null)
                return NotFound();

            if (request.FileName != null) doc.FileName = request.FileName;
            if (request.Shared.HasValue) doc.Shared = request.Shared.Value;
            if (request.SharedWithClient.HasValue) doc.Shared = request.SharedWithClient.Value;

            await _db.SaveChangesAsync();

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
                shared = doc.Shared
            });
        }

        /// <summary>
        /// DELETE /clients/{clientId}/documents/{id} — deletes a document.
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid clientId, Guid id)
        {
            var tenantId = GetTenantId();
            if (tenantId == Guid.Empty)
                return Unauthorized(new { error = "Tenant ID not found in token." });

            var doc = await _db.Documents
                .FirstOrDefaultAsync(d => d.Id == id && d.ClientId == clientId && d.TenantId == tenantId);

            if (doc == null)
                return NotFound();

            _db.Documents.Remove(doc);
            await _db.SaveChangesAsync();

            return NoContent();
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

    public class PatchDocumentRequest
    {
        public string? FileName { get; set; }
        public bool? Shared { get; set; }
        public bool? SharedWithClient { get; set; }
    }
}
