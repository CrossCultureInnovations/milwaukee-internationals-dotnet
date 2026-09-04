using System.Threading.Tasks;

namespace DAL.Interfaces;

/// <summary>
/// Resolves free-text addresses to coordinates through OpenStreetMap's Nominatim service.
/// </summary>
public interface IGeocodingService
{
    /// <summary>
    /// Resolves a location to coordinates, biased to the Milwaukee metro area. Falls back to
    /// the location name when the address is too vague to resolve on its own.
    /// Returns null when nothing could be matched.
    /// </summary>
    Task<GeocodeResult> Resolve(string address, string name);
}

public record GeocodeResult(double Latitude, double Longitude);
