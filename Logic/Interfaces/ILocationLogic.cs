using System.Threading.Tasks;
using Models.Entities;

namespace Logic.Interfaces;

public interface ILocationLogic: IBasicCrudLogic<Location>
{
    Task MoveRankUp(int id);
    
    Task MoveRankDown(int id);

    /// <summary>
    /// Geocodes locations that have no coordinates yet, oldest first. Nominatim allows roughly one
    /// request per second, so this works through a limited batch per call and reports how many are
    /// still outstanding for the caller to continue.
    /// </summary>
    Task<GeocodeSummary> GeocodeMissing(int limit = 10);

    /// <summary>
    /// Stores a hand-corrected pin position.
    /// </summary>
    Task<Location> SetCoordinates(int id, double latitude, double longitude);
}

/// <param name="Processed">Locations attempted in this batch.</param>
/// <param name="Geocoded">Of those, how many resolved to coordinates.</param>
/// <param name="Failed">Of those, how many could not be resolved at all.</param>
/// <param name="Remaining">Locations still without coordinates after this batch.</param>
public record GeocodeSummary(int Processed, int Geocoded, int Failed, int Remaining);
