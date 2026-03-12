using System;
using System.Threading.Tasks;
using Logic.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Models.Entities;

namespace API.Controllers.API;

[AllowAnonymous]
[Route("api/[controller]")]
public class RegistrationController(IRegistrationLogic registrationLogic) : Controller
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
    public async Task<IActionResult> RegisterStudent([FromBody] Student student)
    {
        try
        {
            await registrationLogic.RegisterStudent(student);
            return Ok(new { success = true });
        }
        catch (Exception e)
        {
            return BadRequest(new { error = e.Message });
        }
    }

    [HttpPost]
    [Route("driver")]
    public async Task<IActionResult> RegisterDriver([FromBody] Driver driver)
    {
        try
        {
            await registrationLogic.RegisterDriver(driver);
            return Ok(new { success = true });
        }
        catch (Exception e)
        {
            return BadRequest(new { error = e.Message });
        }
    }
}
