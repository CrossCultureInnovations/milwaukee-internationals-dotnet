using System;
using System.IO;
using System.Threading.Tasks;
using API.Attributes;
using Logic.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Models.Enums;
using Models.ViewModels;

namespace API.Controllers;

[Route("[controller]")]
public class SmsController : Controller
{
    private readonly ISmsUtilityLogic _smsUtilityLogic;

    public SmsController(ISmsUtilityLogic smsUtilityLogic)
    {
        _smsUtilityLogic = smsUtilityLogic;
    }

    [HttpGet]
    [Route("Driver")]
    [AuthorizeMiddleware(UserRoleEnum.Admin)]
    public async Task<ActionResult> SendDriverSms()
    {
        await _smsUtilityLogic.HandleDriverSms();

        return RedirectToAction("Driver", "Attendance");
    }

    [HttpGet]
    [Route("Student")]
    [AuthorizeMiddleware(UserRoleEnum.Admin)]
    public async Task<ActionResult> SendStudentSms()
    {
        await _smsUtilityLogic.HandleStudentSms();

        return RedirectToAction("Student", "Attendance");
    }
    
    [HttpPost]
    [Route("Incoming")]
    [AllowAnonymous]
    public async Task<ActionResult> IncomingSms([FromBody]IncomingSmsViewModel body)
    {
        await _smsUtilityLogic.IncomingSms(body);

        return Ok("received");
    }
}
