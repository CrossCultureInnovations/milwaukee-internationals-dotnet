using System;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;
using System.Threading.Tasks;
using API.Interfaces;
using DAL.Interfaces;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Models.ViewModels;

namespace API.Utilities;

public class CapService(
    IConfigLogic configLogic,
    IHttpClientFactory httpClientFactory,
    IWebHostEnvironment environment,
    ILogger<CapService> logger) : ICapService
{
    public async Task<bool> IsSatisfied(string token)
    {
        var config = await configLogic.ResolveGlobalConfig();
        if (!IsEnabled(config, environment))
        {
            return true;
        }

        if (string.IsNullOrWhiteSpace(token))
        {
            return false;
        }

        if (string.IsNullOrWhiteSpace(config.CapSecretKey))
        {
            logger.LogError("Cap verification is enabled, but the Cap secret key is not configured.");
            return false;
        }

        if (!TryBuildEndpoint(config, out var endpoint))
        {
            logger.LogError("Cap verification is enabled, but the Cap server URL or site key is invalid.");
            return false;
        }

        try
        {
            var client = httpClientFactory.CreateClient();
            var verifyUrl = new Uri(endpoint, "siteverify");
            using var response = await client.PostAsJsonAsync(
                verifyUrl,
                new { secret = config.CapSecretKey, response = token });
            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning(
                    "Cap verification returned HTTP status code {StatusCode}.",
                    (int)response.StatusCode);
                return false;
            }

            var result = await response.Content.ReadFromJsonAsync<CapVerificationResult>();
            return result?.Success == true;
        }
        catch (Exception exception) when (exception is HttpRequestException or JsonException or TaskCanceledException)
        {
            logger.LogWarning(exception, "Cap verification failed.");
            return false;
        }
    }

    private class CapVerificationResult
    {
        public bool Success { get; set; }
    }

    public static bool IsEnabled(GlobalConfigModel config, IWebHostEnvironment environment)
    {
        return environment.IsProduction()
               && config.CaptchaEnabled
               && !string.IsNullOrWhiteSpace(config.CapSecretKey)
               && TryBuildEndpoint(config, out _);
    }

    public static bool TryBuildEndpoint(GlobalConfigModel config, out Uri endpoint)
    {
        endpoint = null;
        if (string.IsNullOrWhiteSpace(config.CapServerUrl) || string.IsNullOrWhiteSpace(config.CapSiteKey))
        {
            return false;
        }

        var serverUrl = config.CapServerUrl.TrimEnd('/');
        var siteKey = config.CapSiteKey.Trim('/');
        return Uri.TryCreate($"{serverUrl}/{siteKey}/", UriKind.Absolute, out endpoint);
    }
}
