using System;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace PrimeSolve.Api.Models
{
    public class Client
    {
        [Key]
        [JsonPropertyName("id")]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        [JsonPropertyName("tenantId")]
        public Guid TenantId { get; set; }

        [Required]
        [JsonPropertyName("adviserId")]
        public Guid AdviserId { get; set; }

        [MaxLength(255)]
        [JsonPropertyName("adviserEmail")]
        public string AdviserEmail { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        [JsonPropertyName("firstName")]
        public string FirstName { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        [JsonPropertyName("lastName")]
        public string LastName { get; set; } = string.Empty;

        [Required]
        [MaxLength(255)]
        [JsonPropertyName("email")]
        public string Email { get; set; } = string.Empty;

        [MaxLength(50)]
        [JsonPropertyName("phone")]
        public string? Phone { get; set; }

        [MaxLength(2000)]
        [JsonPropertyName("notes")]
        public string? Notes { get; set; }

        [MaxLength(30)]
        [JsonPropertyName("status")]
        public string Status { get; set; } = "prospect";

        [MaxLength(30)]
        [JsonPropertyName("factFind")]
        public string? FactFind { get; set; } = "not_started";

        [JsonPropertyName("factFindId")]
        public Guid? FactFindId { get; set; }

        [JsonPropertyName("soas")]
        public int Soas { get; set; } = 0;

        [JsonPropertyName("createdDate")]
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
    }
}
