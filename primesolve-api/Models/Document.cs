using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace PrimeSolve.Api.Models
{
    public enum DocumentStatus
    {
        Processing,
        Extracted,
        Confirmed
    }

    public class Document
    {
        [Key]
        [JsonPropertyName("id")]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        [JsonPropertyName("clientId")]
        public Guid ClientId { get; set; }

        [Required]
        [JsonPropertyName("tenantId")]
        public Guid TenantId { get; set; }

        [Required]
        [MaxLength(255)]
        [JsonPropertyName("fileName")]
        public string FileName { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        [JsonPropertyName("fileType")]
        public string FileType { get; set; } = string.Empty;

        [Required]
        [MaxLength(1024)]
        [JsonPropertyName("blobUrl")]
        public string BlobUrl { get; set; } = string.Empty;

        [JsonPropertyName("status")]
        public DocumentStatus Status { get; set; } = DocumentStatus.Processing;

        [JsonPropertyName("uploadedAt")]
        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

        [Column(TypeName = "nvarchar(max)")]
        [JsonPropertyName("extractedSectionsJson")]
        public string? ExtractedSectionsJson { get; set; }

        [NotMapped]
        [JsonPropertyName("extractedSections")]
        public JsonDocument? ExtractedSections
        {
            get => string.IsNullOrEmpty(ExtractedSectionsJson)
                ? null
                : JsonDocument.Parse(ExtractedSectionsJson);
            set => ExtractedSectionsJson = value?.RootElement.GetRawText();
        }
    }
}
