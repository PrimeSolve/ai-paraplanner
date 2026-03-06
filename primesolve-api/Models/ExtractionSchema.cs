using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace PrimeSolve.Api.Models
{
    /// <summary>
    /// Fact find extraction schema that maps to the front-end sections.
    /// Each field includes a confidence score (0–1).
    /// </summary>
    public class ExtractionResult
    {
        [JsonPropertyName("personal")]
        public PersonalSection? Personal { get; set; }

        [JsonPropertyName("income")]
        public IncomeSection? Income { get; set; }

        [JsonPropertyName("superannuation")]
        public List<SuperannuationEntry>? Superannuation { get; set; }

        [JsonPropertyName("insurance")]
        public List<InsuranceEntry>? Insurance { get; set; }

        [JsonPropertyName("assets_liabilities")]
        public AssetsLiabilitiesSection? AssetsLiabilities { get; set; }

        [JsonPropertyName("liabilities")]
        public List<LiabilityEntry>? Liabilities { get; set; }
    }

    public class ConfidenceField<T>
    {
        [JsonPropertyName("value")]
        public T? Value { get; set; }

        [JsonPropertyName("confidence")]
        public double Confidence { get; set; }
    }

    public class PersonalSection
    {
        [JsonPropertyName("first_name")]
        public ConfidenceField<string>? FirstName { get; set; }

        [JsonPropertyName("last_name")]
        public ConfidenceField<string>? LastName { get; set; }

        [JsonPropertyName("dob")]
        public ConfidenceField<string>? Dob { get; set; }

        [JsonPropertyName("email")]
        public ConfidenceField<string>? Email { get; set; }

        [JsonPropertyName("phone")]
        public ConfidenceField<string>? Phone { get; set; }

        [JsonPropertyName("address")]
        public ConfidenceField<string>? Address { get; set; }
    }

    public class IncomeSection
    {
        [JsonPropertyName("client1")]
        public IncomeClient? Client1 { get; set; }

        [JsonPropertyName("rental_income")]
        public ConfidenceField<decimal>? RentalIncome { get; set; }
    }

    public class IncomeClient
    {
        [JsonPropertyName("gross_salary")]
        public ConfidenceField<decimal>? GrossSalary { get; set; }

        [JsonPropertyName("employer")]
        public ConfidenceField<string>? Employer { get; set; }
    }

    public class SuperannuationEntry
    {
        [JsonPropertyName("fund_name")]
        public ConfidenceField<string>? FundName { get; set; }

        [JsonPropertyName("balance")]
        public ConfidenceField<decimal>? Balance { get; set; }

        [JsonPropertyName("member_number")]
        public ConfidenceField<string>? MemberNumber { get; set; }

        [JsonPropertyName("owner")]
        public ConfidenceField<string>? Owner { get; set; }
    }

    public class InsuranceEntry
    {
        [JsonPropertyName("type")]
        public ConfidenceField<string>? Type { get; set; }

        [JsonPropertyName("sum_insured")]
        public ConfidenceField<decimal>? SumInsured { get; set; }

        [JsonPropertyName("premium")]
        public ConfidenceField<decimal>? Premium { get; set; }

        [JsonPropertyName("owner")]
        public ConfidenceField<string>? Owner { get; set; }
    }

    public class AssetsLiabilitiesSection
    {
        [JsonPropertyName("properties")]
        public List<object>? Properties { get; set; }

        [JsonPropertyName("cash")]
        public List<object>? Cash { get; set; }

        [JsonPropertyName("investments")]
        public List<object>? Investments { get; set; }
    }

    public class LiabilityEntry
    {
        [JsonPropertyName("lender")]
        public ConfidenceField<string>? Lender { get; set; }

        [JsonPropertyName("balance")]
        public ConfidenceField<decimal>? Balance { get; set; }

        [JsonPropertyName("repayment")]
        public ConfidenceField<decimal>? Repayment { get; set; }

        [JsonPropertyName("type")]
        public ConfidenceField<string>? Type { get; set; }
    }
}
