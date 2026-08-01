using System;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;
using Logic.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Models.Entities;

namespace API.Controllers.API;

[AllowAnonymous]
[Route("api/[controller]")]
public class RegistrationController(
    IRegistrationLogic registrationLogic,
    IHttpClientFactory httpClientFactory,
    IConfiguration configuration) : Controller
{
    [HttpGet]
    [Route("student/status")]
    public async Task<IActionResult> StudentStatus()
    {
        var isOpen = await registrationLogic.IsRegisterStudentOpen();
        return Ok(new { isOpen });
    }

    [HttpGet]
    [Route("driver/status")]
    public async Task<IActionResult> DriverStatus()
    {
        var isOpen = await registrationLogic.IsRegisterDriverOpen();
        return Ok(new { isOpen });
    }

    [HttpPost]
    [Route("student")]
    public async Task<IActionResult> RegisterStudent([FromBody] RegistrationRequest<Student> request)
    {
        if (!await VerifyAltcha(request.Altcha))
        {
            return BadRequest(new { error = "Please complete the anti-spam verification." });
        }

        try
        {
            await registrationLogic.RegisterStudent(request.Registration);
            return Ok(new { success = true });
        }
        catch (Exception e)
        {
            return BadRequest(new { error = e.Message });
        }
    }

    [HttpPost]
    [Route("driver")]
    public async Task<IActionResult> RegisterDriver([FromBody] RegistrationRequest<Driver> request)
    {
        if (!await VerifyAltcha(request.Altcha))
        {
            return BadRequest(new { error = "Please complete the anti-spam verification." });
        }

        try
        {
            await registrationLogic.RegisterDriver(request.Registration);
            return Ok(new { success = true });
        }
        catch (Exception e)
        {
            return BadRequest(new { error = e.Message });
        }
    }

    private async Task<bool> VerifyAltcha(string payload)
    {
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
            using var response = await client.PostAsJsonAsync(
                verifyUrl,
                new { payload, secret });
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
}

public class RegistrationRequest<T>
{
    public T Registration { get; set; }
    public string Altcha { get; set; }
}

public class AltchaVerificationResult
{
    public bool Verified { get; set; }
}
