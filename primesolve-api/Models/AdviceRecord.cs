using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PrimeSolve.Api.Models
{
    public class AdviceRecord
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public Guid ClientId { get; set; }

        [Required]
        public Guid AdviserId { get; set; }

        [Required]
        public Guid TenantId { get; set; }

        [Required]
        [MaxLength(50)]
        public string Type { get; set; } = string.Empty;

        [Required]
        [MaxLength(500)]
        public string Name { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [MaxLength(255)]
        public string CreatedBy { get; set; } = string.Empty;

        [Column(TypeName = "nvarchar(max)")]
        public string SnapshotJson { get; set; } = "{}";
    }
}
