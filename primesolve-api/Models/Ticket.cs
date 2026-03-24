using System;
using System.ComponentModel.DataAnnotations;

namespace PrimeSolve.Api.Models
{
    public class Ticket
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        public int TicketNumber { get; set; }

        [Required]
        public Guid AdviserId { get; set; }

        [Required]
        public Guid AdviceGroupId { get; set; }

        [Required]
        public Guid TenantId { get; set; }

        [Required]
        [MaxLength(500)]
        public string Subject { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string Category { get; set; } = string.Empty;

        [Required]
        [MaxLength(20)]
        public string Priority { get; set; } = "Medium";

        [Required]
        public string Description { get; set; } = string.Empty;

        [Required]
        [MaxLength(20)]
        public string Status { get; set; } = "Open";

        public Guid? RelatedClientId { get; set; }

        public Guid? RelatedSOAId { get; set; }

        [MaxLength(255)]
        public string? RelatedFeature { get; set; }

        public string? AdditionalContext { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
