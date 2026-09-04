using System;
using System.Globalization;
using System.Net.Http;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using DAL.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace DAL.ServiceApi;

public class GeocodingService(
    IHttpClientFactory httpClientFactory,
    IConfiguration configuration,
    ILogger<GeocodingService> logger) : IGeocodingService
{
    /// <summary>
    /// Bounding box around the Milwaukee metro area as lon,lat,lon,lat. Without this bias a bare
    /// street name such as "Capitol Drive" happily resolves to another state.
    /// </summary>
    private const string MilwaukeeViewBox = "-88.15,43.35,-87.65,42.80";

    private const string NominatimSearchUrl = "https://nominatim.openstreetmap.org/search";

    /// <summary>
    /// Nominatim's usage policy caps anonymous use at one request per second. The gate is static
    /// because the service is registered transient, so every instance shares the same budget.
    /// </summary>
    private static readonly SemaphoreSlim RateGate = new(1, 1);

    private static DateTimeOffset _lastRequest = DateTimeOffset.MinValue;

    private static readonly TimeSpan MinimumInterval = TimeSpan.FromMilliseconds(1100);

    public async Task<GeocodeResult> Resolve(string address, string name)
    {
        var normalizedAddress = NormalizeAddress(address);

        // Ordered from most to least precise. A vague address ("MSOE area") often fails while the
        // location name ("Milwaukee School of Engineering") resolves cleanly, so the name is tried
        // next. The unbounded pass is last so a genuine out-of-area address still lands somewhere.
        var attempts = new[]
        {
            (Query: normalizedAddress, Bounded: true),
            (Query: NormalizeAddress(name), Bounded: true),
            (Query: normalizedAddress, Bounded: false)
        };

        foreach (var attempt in attempts)
        {
            if (string.IsNullOrWhiteSpace(attempt.Query)) continue;

            var result = await Search(attempt.Query, attempt.Bounded);

            if (result != null) return result;
        }

        logger.LogWarning("Could not geocode location '{Name}' at '{Address}'", name, address);

        return null;
    }

    /// <summary>
    /// Rewrites the loosely formatted addresses this data set carries into something Nominatim
    /// has a chance of matching.
    /// </summary>
    internal static string NormalizeAddress(string address)
    {
        if (string.IsNullOrWhiteSpace(address)) return null;

        var normalized = address.Trim();

        // "Humboldt Boulevard near Brady Street" -> "Humboldt Boulevard"
        var nearIndex = normalized.IndexOf(" near ", StringComparison.OrdinalIgnoreCase);
        if (nearIndex > 0) normalized = normalized[..nearIndex];

        // "Milwaukee Public Market area" / "Historic Third Ward district" describe neighbourhoods
        // rather than places; the trailing noun stops Nominatim matching them.
        normalized = Regex.Replace(normalized, @"\s+(area|district)$", string.Empty,
            RegexOptions.IgnoreCase);

        normalized = normalized.Trim().TrimEnd(',');

        if (string.IsNullOrWhiteSpace(normalized)) return null;

        // Anything without a state or ZIP is a bare street or landmark, which needs a city to be
        // resolvable at all.
        var hasRegion = Regex.IsMatch(normalized, @"\b(WI|Wisconsin)\b", RegexOptions.IgnoreCase)
                        || Regex.IsMatch(normalized, @"\b\d{5}\b");

        return hasRegion ? normalized : $"{normalized}, Milwaukee, WI";
    }

    private async Task<GeocodeResult> Search(string query, bool bounded)
    {
        var url = $"{NominatimSearchUrl}?format=jsonv2&limit=1&viewbox={MilwaukeeViewBox}" +
                  $"&bounded={(bounded ? 1 : 0)}&q={Uri.EscapeDataString(query)}";

        try
        {
            await WaitForRateLimit();

            using var request = new HttpRequestMessage(HttpMethod.Get, url);

            // Nominatim rejects requests that do not identify the caller.
            request.Headers.UserAgent.ParseAdd(
                configuration["GeocodingSettings:UserAgent"]
                ?? "MilwaukeeInternationals/1.0 (+https://milwaukeeinternationals.com)");

            var client = httpClientFactory.CreateClient();
            using var response = await client.SendAsync(request);

            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning("Geocoding request for '{Query}' failed with {Status}", query,
                    response.StatusCode);
                return null;
            }

            await using var stream = await response.Content.ReadAsStreamAsync();
            using var document = await JsonDocument.ParseAsync(stream);

            if (document.RootElement.ValueKind != JsonValueKind.Array ||
                document.RootElement.GetArrayLength() == 0)
            {
                return null;
            }

            var match = document.RootElement[0];

            if (!TryReadCoordinate(match, "lat", out var latitude) ||
                !TryReadCoordinate(match, "lon", out var longitude))
            {
                return null;
            }

            return new GeocodeResult(latitude, longitude);
        }
        catch (Exception exception) when (exception is HttpRequestException or JsonException or TaskCanceledException)
        {
            logger.LogWarning(exception, "Geocoding request for '{Query}' threw", query);
            return null;
        }
    }

    /// <summary>
    /// Nominatim returns coordinates as strings.
    /// </summary>
    private static bool TryReadCoordinate(JsonElement element, string property, out double value)
    {
        value = 0;

        return element.TryGetProperty(property, out var raw)
               && raw.ValueKind == JsonValueKind.String
               && double.TryParse(raw.GetString(), NumberStyles.Float, CultureInfo.InvariantCulture,
                   out value);
    }

    private static async Task WaitForRateLimit()
    {
        await RateGate.WaitAsync();

        try
        {
            var elapsed = DateTimeOffset.UtcNow - _lastRequest;

            if (elapsed < MinimumInterval) await Task.Delay(MinimumInterval - elapsed);

            _lastRequest = DateTimeOffset.UtcNow;
        }
        finally
        {
            RateGate.Release();
        }
    }
}
