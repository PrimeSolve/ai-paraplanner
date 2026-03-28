using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PrimeSolve.Api.Models
{
    public class SoaTemplateShare
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public Guid TemplateId { get; set; }

        [ForeignKey(nameof(TemplateId))]
        public SoaTemplate Template { get; set; } = null!;

        [Required]
        public Guid SharedByTenantId { get; set; }

        /// <summary>
        /// NULL means shared to ALL advice groups.
        /// </summary>
        public Guid? SharedToTenantId { get; set; }

        /// <summary>
        /// Advice Group can hide a Global Admin template from their advisers.
        /// </summary>
        public bool IsHidden { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
