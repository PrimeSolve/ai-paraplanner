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

        [JsonPropertyName("assets")]
        public List<AssetEntry>? Assets { get; set; }

        [JsonPropertyName("liabilities")]
        public List<LiabilityEntry>? Liabilities { get; set; }

        [JsonPropertyName("dependants")]
        public List<DependantEntry>? Dependants { get; set; }

        [JsonPropertyName("trusts_companies")]
        public List<TrustCompanyEntry>? TrustsCompanies { get; set; }

        [JsonPropertyName("smsf")]
        public List<SmsfEntry>? Smsf { get; set; }

        [JsonPropertyName("investments")]
        public List<InvestmentEntry>? Investments { get; set; }

        [JsonPropertyName("super_tax")]
        public SuperTaxSection? SuperTax { get; set; }
    }

    public class ConfidenceField<T>
    {
        [JsonPropertyName("value")]
        public T? Value { get; set; }

        [JsonPropertyName("confidence")]
        public double Confidence { get; set; }
    }

    // ──────────────────────────────────────────────
    // Personal
    // ──────────────────────────────────────────────
    public class PersonalSection
    {
        [JsonPropertyName("first_name")]
        public ConfidenceField<string>? FirstName { get; set; }

        [JsonPropertyName("last_name")]
        public ConfidenceField<string>? LastName { get; set; }

        [JsonPropertyName("date_of_birth")]
        public ConfidenceField<string>? DateOfBirth { get; set; }

        [JsonPropertyName("gender")]
        public ConfidenceField<string>? Gender { get; set; }

        [JsonPropertyName("marital_status")]
        public ConfidenceField<string>? MaritalStatus { get; set; }

        [JsonPropertyName("email")]
        public ConfidenceField<string>? Email { get; set; }

        [JsonPropertyName("phone")]
        public ConfidenceField<string>? Phone { get; set; }

        [JsonPropertyName("address")]
        public ConfidenceField<string>? Address { get; set; }

        [JsonPropertyName("suburb")]
        public ConfidenceField<string>? Suburb { get; set; }

        [JsonPropertyName("state")]
        public ConfidenceField<string>? State { get; set; }

        [JsonPropertyName("postcode")]
        public ConfidenceField<string>? Postcode { get; set; }

        [JsonPropertyName("employment_status")]
        public ConfidenceField<string>? EmploymentStatus { get; set; }

        [JsonPropertyName("occupation")]
        public ConfidenceField<string>? Occupation { get; set; }

        [JsonPropertyName("employer")]
        public ConfidenceField<string>? Employer { get; set; }

        [JsonPropertyName("smoker_status")]
        public ConfidenceField<string>? SmokerStatus { get; set; }

        [JsonPropertyName("health_status")]
        public ConfidenceField<string>? HealthStatus { get; set; }

        [JsonPropertyName("has_will")]
        public ConfidenceField<string>? HasWill { get; set; }
    }

    // ──────────────────────────────────────────────
    // Income
    // ──────────────────────────────────────────────
    public class IncomeSection
    {
        [JsonPropertyName("client1")]
        public IncomeClient? Client1 { get; set; }

        [JsonPropertyName("client2")]
        public IncomeClient? Client2 { get; set; }

        [JsonPropertyName("rental_income")]
        public ConfidenceField<decimal>? RentalIncome { get; set; }
    }

    public class IncomeClient
    {
        [JsonPropertyName("i_type")]
        public ConfidenceField<string>? IncomeType { get; set; }

        [JsonPropertyName("i_gross")]
        public ConfidenceField<string>? GrossSalary { get; set; }

        [JsonPropertyName("employer")]
        public ConfidenceField<string>? Employer { get; set; }

        [JsonPropertyName("i_bonus")]
        public ConfidenceField<string>? Bonus { get; set; }

        [JsonPropertyName("i_fbt")]
        public ConfidenceField<string>? FringeBenefits { get; set; }

        [JsonPropertyName("i_fbt_value")]
        public ConfidenceField<string>? FbtValue { get; set; }

        [JsonPropertyName("i_increase")]
        public ConfidenceField<string>? SalaryIncrease { get; set; }

        [JsonPropertyName("i_nontax")]
        public ConfidenceField<string>? NonTaxable { get; set; }

        [JsonPropertyName("i_super_inc")]
        public ConfidenceField<string>? SuperIncluded { get; set; }
    }

    // ──────────────────────────────────────────────
    // Superannuation
    // ──────────────────────────────────────────────
    public class SuperannuationEntry
    {
        [JsonPropertyName("type")]
        public ConfidenceField<string>? Type { get; set; }

        [JsonPropertyName("fund_name")]
        public ConfidenceField<string>? FundName { get; set; }

        [JsonPropertyName("provider")]
        public ConfidenceField<string>? Provider { get; set; }

        [JsonPropertyName("balance")]
        public ConfidenceField<decimal>? Balance { get; set; }

        [JsonPropertyName("member_number")]
        public ConfidenceField<string>? MemberNumber { get; set; }

        [JsonPropertyName("owner")]
        public ConfidenceField<string>? Owner { get; set; }

        [JsonPropertyName("super_guarantee")]
        public ConfidenceField<string>? SuperGuarantee { get; set; }

        [JsonPropertyName("salary_sacrifice")]
        public ConfidenceField<string>? SalarySacrifice { get; set; }

        [JsonPropertyName("after_tax")]
        public ConfidenceField<string>? AfterTax { get; set; }
    }

    // ──────────────────────────────────────────────
    // Insurance
    // ──────────────────────────────────────────────
    public class InsuranceEntry
    {
        [JsonPropertyName("pol_name")]
        public ConfidenceField<string>? PolicyName { get; set; }

        [JsonPropertyName("pol_type")]
        public ConfidenceField<string>? PolicyType { get; set; }

        [JsonPropertyName("pol_tax_env")]
        public ConfidenceField<string>? TaxEnvironment { get; set; }

        [JsonPropertyName("pol_owner")]
        public ConfidenceField<string>? Owner { get; set; }

        [JsonPropertyName("pol_insured")]
        public ConfidenceField<string>? Insured { get; set; }

        [JsonPropertyName("pol_provider")]
        public ConfidenceField<string>? Provider { get; set; }

        [JsonPropertyName("pol_number")]
        public ConfidenceField<string>? PolicyNumber { get; set; }

        [JsonPropertyName("pol_waiting")]
        public ConfidenceField<string>? WaitingPeriod { get; set; }

        [JsonPropertyName("pol_benefit_period")]
        public ConfidenceField<string>? BenefitPeriod { get; set; }

        [JsonPropertyName("sum_insured_life")]
        public ConfidenceField<string>? SumInsuredLife { get; set; }

        [JsonPropertyName("sum_insured_tpd")]
        public ConfidenceField<string>? SumInsuredTpd { get; set; }

        [JsonPropertyName("sum_insured_trauma")]
        public ConfidenceField<string>? SumInsuredTrauma { get; set; }

        [JsonPropertyName("sum_insured_ip")]
        public ConfidenceField<string>? SumInsuredIp { get; set; }

        [JsonPropertyName("premium_life")]
        public ConfidenceField<string>? PremiumLife { get; set; }

        [JsonPropertyName("premium_tpd")]
        public ConfidenceField<string>? PremiumTpd { get; set; }

        [JsonPropertyName("premium_trauma")]
        public ConfidenceField<string>? PremiumTrauma { get; set; }

        [JsonPropertyName("premium_ip")]
        public ConfidenceField<string>? PremiumIp { get; set; }

        [JsonPropertyName("pol_freq")]
        public ConfidenceField<string>? Frequency { get; set; }

        [JsonPropertyName("pol_structure")]
        public ConfidenceField<string>? Structure { get; set; }
    }

    // ──────────────────────────────────────────────
    // Assets
    // ──────────────────────────────────────────────
    public class AssetEntry
    {
        [JsonPropertyName("a_name")]
        public ConfidenceField<string>? Name { get; set; }

        [JsonPropertyName("a_description")]
        public ConfidenceField<string>? Description { get; set; }

        [JsonPropertyName("a_type")]
        public ConfidenceField<string>? AssetType { get; set; }

        [JsonPropertyName("a_value")]
        public ConfidenceField<string>? Value { get; set; }

        [JsonPropertyName("a_owner")]
        public ConfidenceField<string>? Owner { get; set; }

        [JsonPropertyName("a_address")]
        public ConfidenceField<string>? Address { get; set; }

        [JsonPropertyName("a_purchase_price")]
        public ConfidenceField<string>? PurchasePrice { get; set; }

        [JsonPropertyName("a_rental_income")]
        public ConfidenceField<string>? RentalIncome { get; set; }
    }

    // ──────────────────────────────────────────────
    // Liabilities
    // ──────────────────────────────────────────────
    public class LiabilityEntry
    {
        [JsonPropertyName("d_name")]
        public ConfidenceField<string>? Name { get; set; }

        [JsonPropertyName("d_type")]
        public ConfidenceField<string>? DebtType { get; set; }

        [JsonPropertyName("lender")]
        public ConfidenceField<string>? Lender { get; set; }

        [JsonPropertyName("d_balance")]
        public ConfidenceField<string>? Balance { get; set; }

        [JsonPropertyName("d_repayments")]
        public ConfidenceField<string>? Repayment { get; set; }

        [JsonPropertyName("d_rate")]
        public ConfidenceField<string>? InterestRate { get; set; }

        [JsonPropertyName("d_owner")]
        public ConfidenceField<string>? Owner { get; set; }
    }

    // ──────────────────────────────────────────────
    // Dependants
    // ──────────────────────────────────────────────
    public class DependantEntry
    {
        [JsonPropertyName("name")]
        public ConfidenceField<string>? Name { get; set; }

        [JsonPropertyName("date_of_birth")]
        public ConfidenceField<string>? DateOfBirth { get; set; }

        [JsonPropertyName("dep_type")]
        public ConfidenceField<string>? DependantType { get; set; }

        [JsonPropertyName("relationship")]
        public ConfidenceField<string>? Relationship { get; set; }

        [JsonPropertyName("financially_dependent")]
        public ConfidenceField<string>? FinanciallyDependent { get; set; }
    }

    // ──────────────────────────────────────────────
    // Trusts & Companies
    // ──────────────────────────────────────────────
    public class TrustCompanyEntry
    {
        [JsonPropertyName("type")]
        public ConfidenceField<string>? EntityType { get; set; }

        [JsonPropertyName("trust_name")]
        public ConfidenceField<string>? TrustName { get; set; }

        [JsonPropertyName("trust_type")]
        public ConfidenceField<string>? TrustType { get; set; }

        [JsonPropertyName("trust_abn")]
        public ConfidenceField<string>? TrustAbn { get; set; }

        [JsonPropertyName("company_name")]
        public ConfidenceField<string>? CompanyName { get; set; }

        [JsonPropertyName("company_abn")]
        public ConfidenceField<string>? CompanyAbn { get; set; }
    }

    // ──────────────────────────────────────────────
    // SMSF
    // ──────────────────────────────────────────────
    public class SmsfEntry
    {
        [JsonPropertyName("smsf_name")]
        public ConfidenceField<string>? SmsfName { get; set; }

        [JsonPropertyName("smsf_abn")]
        public ConfidenceField<string>? SmsfAbn { get; set; }

        [JsonPropertyName("smsf_balance")]
        public ConfidenceField<string>? Balance { get; set; }

        [JsonPropertyName("fund_type")]
        public ConfidenceField<string>? FundType { get; set; }

        [JsonPropertyName("trustee_type")]
        public ConfidenceField<string>? TrusteeType { get; set; }

        [JsonPropertyName("accounts")]
        public List<SmsfAccountEntry>? Accounts { get; set; }
    }

    public class SmsfAccountEntry
    {
        [JsonPropertyName("owner")]
        public ConfidenceField<string>? Owner { get; set; }

        [JsonPropertyName("balance")]
        public ConfidenceField<string>? Balance { get; set; }

        [JsonPropertyName("tax_environment")]
        public ConfidenceField<string>? TaxEnvironment { get; set; }

        [JsonPropertyName("super_guarantee")]
        public ConfidenceField<string>? SuperGuarantee { get; set; }

        [JsonPropertyName("salary_sacrifice")]
        public ConfidenceField<string>? SalarySacrifice { get; set; }
    }

    // ──────────────────────────────────────────────
    // Investments (Wraps & Bonds)
    // ──────────────────────────────────────────────
    public class InvestmentEntry
    {
        [JsonPropertyName("inv_type")]
        public ConfidenceField<string>? InvestmentType { get; set; }

        [JsonPropertyName("platform_name")]
        public ConfidenceField<string>? PlatformName { get; set; }

        [JsonPropertyName("product_name")]
        public ConfidenceField<string>? ProductName { get; set; }

        [JsonPropertyName("owner")]
        public ConfidenceField<string>? Owner { get; set; }

        [JsonPropertyName("account_number")]
        public ConfidenceField<string>? AccountNumber { get; set; }

        [JsonPropertyName("balance")]
        public ConfidenceField<string>? Balance { get; set; }
    }

    // ──────────────────────────────────────────────
    // Super & Tax
    // ──────────────────────────────────────────────
    public class SuperTaxSection
    {
        [JsonPropertyName("client")]
        public SuperTaxPerson? Client { get; set; }

        [JsonPropertyName("partner")]
        public SuperTaxPerson? Partner { get; set; }
    }

    public class SuperTaxPerson
    {
        [JsonPropertyName("tbc_used")]
        public ConfidenceField<string>? TbcUsed { get; set; }

        [JsonPropertyName("tbc_used_amt")]
        public ConfidenceField<string>? TbcUsedAmt { get; set; }

        [JsonPropertyName("cc_used")]
        public ConfidenceField<string>? CcUsed { get; set; }

        [JsonPropertyName("div293")]
        public ConfidenceField<string>? Div293 { get; set; }

        [JsonPropertyName("pre_losses")]
        public ConfidenceField<string>? PreLosses { get; set; }

        [JsonPropertyName("pre_cgt_losses")]
        public ConfidenceField<string>? PreCgtLosses { get; set; }
    }
}
