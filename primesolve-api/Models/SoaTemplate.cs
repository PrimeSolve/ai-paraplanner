using System;
using System.ComponentModel.DataAnnotations;

namespace PrimeSolve.Api.Models
{
    public class SoaTemplate
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        [MaxLength(255)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string? Description { get; set; }

        /// <summary>
        /// 0 = Admin (platform-wide), 1 = AdviceGroup, 2 = Adviser
        /// </summary>
        public int OwnerType { get; set; }

        /// <summary>
        /// The ID of the owning entity (AdviceGroupId or AdviserId).
        /// Null/empty for admin templates (ownerType=0).
        /// </summary>
        [MaxLength(255)]
        public string? OwnerId { get; set; }

        /// <summary>
        /// TenantId for RLS scoping. Admin templates use the PrimeSolve
        /// platform tenant (C63CB975-3DA5-416E-8957-03D3AFB27AFB).
        /// </summary>
        [Required]
        public Guid TenantId { get; set; }

        /// <summary>
        /// JSON-serialised section groups.
        /// </summary>
        public string? Sections { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
