using System;
using System.ComponentModel.DataAnnotations;

namespace PrimeSolve.Api.Models
{
    public class Client
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public Guid TenantId { get; set; }

        [Required]
        public Guid AdviserId { get; set; }

        [MaxLength(255)]
        public string AdviserEmail { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string FirstName { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string LastName { get; set; } = string.Empty;

        [Required]
        [MaxLength(255)]
        public string Email { get; set; } = string.Empty;

        [MaxLength(50)]
        public string? Phone { get; set; }

        [MaxLength(2000)]
        public string? Notes { get; set; }

        [MaxLength(30)]
        public string Status { get; set; } = "prospect";

        [MaxLength(30)]
        public string? FactFind { get; set; } = "not_started";

        public Guid? FactFindId { get; set; }

        public int Soas { get; set; } = 0;

        [MaxLength(500)]
        public string? ProfilePhotoUrl { get; set; }

        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        public bool HasSeenWelcome { get; set; } = false;
    }
}
