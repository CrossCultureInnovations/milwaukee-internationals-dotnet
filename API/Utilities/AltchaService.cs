using System;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;
using API.Interfaces;
using DAL.Interfaces;
using Microsoft.Extensions.Configuration;

namespace API.Utilities;

public class AltchaService(
    IConfigLogic configLogic,
    IHttpClientFactory httpClientFactory,
    IConfiguration configuration) : IAltchaService
{
    public async Task<bool> IsSatisfied(string payload)
    {
        if (!(await configLogic.ResolveGlobalConfig()).CaptchaEnabled)
        {
            return true;
        }

        var secret = configuration["ALTCHA_SECRET"];
        if (string.IsNullOrWhiteSpace(payload) || string.IsNullOrWhiteSpace(secret))
        {
            return false;
        }

        try
        {
            var client = httpClientFactory.CreateClient();
            var verifyUrl = configuration["ALTCHA_VERIFY_URL"]
                ?? "https://altcha.coolify.hesamian.com/v1/verify/signature";
            using var response = await client.PostAsJsonAsync(verifyUrl, new { payload, secret });
            if (!response.IsSuccessStatusCode)
            {
                return false;
            }

            var result = await response.Content.ReadFromJsonAsync<AltchaVerificationResult>();
            return result?.Verified == true;
        }
        catch (Exception exception) when (exception is HttpRequestException or System.Text.Json.JsonException)
        {
            return false;
        }
    }

    private class AltchaVerificationResult
    {
        public bool Verified { get; set; }
    }
}
