using System;
using System.Threading.Tasks;
using API.Interfaces;
using DAL.Interfaces;
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
    IConfigLogic configLogic,
    IAltchaService altchaService,
    IConfiguration configuration) : Controller
{
    [HttpGet]
    [Route("student/status")]
    public async Task<IActionResult> StudentStatus()
    {
        var isOpen = await registrationLogic.IsRegisterStudentOpen();
        var captchaEnabled = (await configLogic.ResolveGlobalConfig()).CaptchaEnabled;
        var challengeUrl = configuration["AltchaSettings:ChallengeUrl"];
        return Ok(new { isOpen, captchaEnabled, challengeUrl });
    }

    [HttpGet]
    [Route("driver/status")]
    public async Task<IActionResult> DriverStatus()
    {
        var isOpen = await registrationLogic.IsRegisterDriverOpen();
        var captchaEnabled = (await configLogic.ResolveGlobalConfig()).CaptchaEnabled;
        var challengeUrl = configuration["AltchaSettings:ChallengeUrl"];
        return Ok(new { isOpen, captchaEnabled, challengeUrl });
    }

    [HttpPost]
    [Route("student")]
    public async Task<IActionResult> RegisterStudent([FromBody] RegistrationRequest<Student> request)
    {
        if (!await altchaService.IsSatisfied(request.Altcha))
        {
            return BadRequest(new { error = "Please complete the anti-spam verification." });
        }

        try
        {
            var student = await registrationLogic.RegisterStudent(request.Registration);
            return Ok(new
            {
                success = true,
                displayId = student?.DisplayId,
                studentNumber = student?.DisplayId?.Split('-').Last()
            });
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
        if (!await altchaService.IsSatisfied(request.Altcha))
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

}

public class RegistrationRequest<T>
{
    public T Registration { get; set; }
    public string Altcha { get; set; }
}

