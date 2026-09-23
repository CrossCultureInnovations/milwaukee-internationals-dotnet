using System;
using System.Linq;
using System.Threading.Tasks;
using API.Interfaces;
using DAL.Interfaces;
using API.Utilities;
using Logic.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Models.Entities;

namespace API.Controllers.API;

[AllowAnonymous]
[Route("api/[controller]")]
public class RegistrationController(
    IRegistrationLogic registrationLogic,
    IConfigLogic configLogic,
    ICapService capService,
    IWebHostEnvironment environment) : Controller
{
    [HttpGet]
    [Route("student/status")]
    public async Task<IActionResult> StudentStatus()
    {
        var isOpen = await registrationLogic.IsRegisterStudentOpen();
        var config = await configLogic.ResolveGlobalConfig();
        var captchaEnabled = CapService.IsEnabled(config, environment);
        var captchaEndpoint = captchaEnabled && CapService.TryBuildEndpoint(config, out var endpoint)
            ? endpoint.AbsoluteUri
            : null;
        return Ok(new { isOpen, captchaEnabled, captchaEndpoint });
    }

    [HttpGet]
    [Route("driver/status")]
    public async Task<IActionResult> DriverStatus()
    {
        var isOpen = await registrationLogic.IsRegisterDriverOpen();
        var config = await configLogic.ResolveGlobalConfig();
        var captchaEnabled = CapService.IsEnabled(config, environment);
        var captchaEndpoint = captchaEnabled && CapService.TryBuildEndpoint(config, out var endpoint)
            ? endpoint.AbsoluteUri
            : null;
        return Ok(new { isOpen, captchaEnabled, captchaEndpoint });
    }

    [HttpPost]
    [Route("student")]
    public async Task<IActionResult> RegisterStudent([FromBody] RegistrationRequest<Student> request)
    {
        if (User.Identity is not { IsAuthenticated: true } && !await registrationLogic.IsRegisterStudentOpen())
        {
            return BadRequest(new { error = "Student registration is closed." });
        }

        if (!await capService.IsSatisfied(request.CaptchaToken))
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
        if (User.Identity is not { IsAuthenticated: true } && !await registrationLogic.IsRegisterDriverOpen())
        {
            return BadRequest(new { error = "Driver registration is closed." });
        }

        if (!await capService.IsSatisfied(request.CaptchaToken))
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
    public string CaptchaToken { get; set; }
}
