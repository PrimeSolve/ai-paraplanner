using System.Text.Json.Serialization;

namespace PrimeSolve.Api.Models
{
    public class CheckoutRequest
    {
        [JsonPropertyName("priceType")]
        public string PriceType { get; set; } = string.Empty;
    }
}
