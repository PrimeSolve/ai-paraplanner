using System;
using System.ComponentModel.DataAnnotations;

namespace PrimeSolve.Api.Models
{
    public class AvatarConfig
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public Guid TenantId { get; set; }

        [Required]
        [MaxLength(50)]
        public string Role { get; set; } = string.Empty;

        public bool IsEnabled { get; set; } = true;

        [MaxLength(100)]
        public string? AvatarId { get; set; }

        [MaxLength(100)]
        public string? VoiceId { get; set; }

        [MaxLength(50)]
        public string? VoiceProvider { get; set; }

        [MaxLength(4000)]
        public string? WelcomeScript { get; set; }

        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedDate { get; set; } = DateTime.UtcNow;
    }
}
