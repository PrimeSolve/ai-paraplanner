using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

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
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public Guid ClientId { get; set; }

        [Required]
        public Guid TenantId { get; set; }

        [Required]
        [MaxLength(255)]
        public string FileName { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string FileType { get; set; } = string.Empty;

        [Required]
        [MaxLength(1024)]
        public string BlobUrl { get; set; } = string.Empty;

        public DocumentStatus Status { get; set; } = DocumentStatus.Processing;

        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

        public long? SizeBytes { get; set; }

        [MaxLength(100)]
        public string? Category { get; set; }

        public bool Shared { get; set; }

        [Column(TypeName = "nvarchar(max)")]
        public string? ExtractedSectionsJson { get; set; }

        [NotMapped]
        public JsonDocument? ExtractedSections
        {
            get => string.IsNullOrEmpty(ExtractedSectionsJson)
                ? null
                : JsonDocument.Parse(ExtractedSectionsJson);
            set => ExtractedSectionsJson = value?.RootElement.GetRawText();
        }
    }
}
