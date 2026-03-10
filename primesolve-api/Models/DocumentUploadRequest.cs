using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Http;

namespace PrimeSolve.Api.Models
{
    public class DocumentUploadRequest
    {
        [JsonPropertyName("file")]
        public required IFormFile File { get; set; }

        [JsonPropertyName("clientId")]
        public required string ClientId { get; set; }

        [JsonPropertyName("fileType")]
        public string? FileType { get; set; }
    }
}
