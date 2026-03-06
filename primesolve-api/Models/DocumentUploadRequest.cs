using Microsoft.AspNetCore.Http;

namespace PrimeSolve.Api.Models
{
    public class DocumentUploadRequest
    {
        public required IFormFile File { get; set; }
        public required string ClientId { get; set; }
        public string? FileType { get; set; }
    }
}
