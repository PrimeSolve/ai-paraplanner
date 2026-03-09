using System;
using System.ComponentModel.DataAnnotations;

namespace PrimeSolve.Api.Models
{
    public class AdviceRequest
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public Guid TenantId { get; set; }

        public Guid? ClientId { get; set; }

        /// <summary>
        /// Stores all fact-find section data as a single JSON object.
        /// Top-level keys include: personal, incomeExpenses, superannuation,
        /// investment, assetsLiabilities, insurance, dependants, trustsCompanies,
        /// smsf, riskProfile, adviceReason, superTax, status, sectionsCompleted,
        /// completionPercentage, etc.
        /// </summary>
        public string? Data { get; set; }

        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedDate { get; set; } = DateTime.UtcNow;
    }
}
