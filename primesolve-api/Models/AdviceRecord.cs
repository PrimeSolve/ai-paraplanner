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

        /// <summary>
        /// "Cashflow Model" | "Fact Find" | "SOA Request"
        /// </summary>
        [Required]
        [MaxLength(50)]
        public string Type { get; set; } = string.Empty;

        /// <summary>
        /// User-defined name for this record.
        /// </summary>
        [Required]
        [MaxLength(500)]
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// UTC timestamp, set once on creation, never updated.
        /// </summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Adviser name (from JWT) who created this record.
        /// </summary>
        [MaxLength(255)]
        public string CreatedBy { get; set; } = string.Empty;

        /// <summary>
        /// Full JSON snapshot of the object at the moment it was saved.
        /// This is the permanent, immutable record.
        /// </summary>
        [Column(TypeName = "nvarchar(max)")]
        public string SnapshotJson { get; set; } = "{}";
    }
}
