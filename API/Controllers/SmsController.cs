using System.Threading.Tasks;
using API.Attributes;
using Logic.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Models.Enums;
using SmsProxyHub.Contracts;

namespace API.Controllers;

[Route("[controller]")]
public class SmsController(ISmsUtilityLogic smsUtilityLogic) : Controller
{
    [HttpGet]
    [Route("Driver")]
    [AuthorizeMiddleware(UserRoleEnum.Admin)]
    public async Task<ActionResult> SendDriverSms()
    {
        await smsUtilityLogic.HandleDriverSms();

        return RedirectToAction("Driver", "Attendance");
    }

    [HttpGet]
    [Route("Student")]
    [AuthorizeMiddleware(UserRoleEnum.Admin)]
    public async Task<ActionResult> SendStudentSms()
    {
        await smsUtilityLogic.HandleStudentSms();

        return RedirectToAction("Student", "Attendance");
    }
    
    [HttpPost("Incoming")]
    [HttpPost("/api/sms/webhook-callback")]
    [AllowAnonymous]
    public async Task<ActionResult> IncomingSms([FromBody] WebhookCallbackPayload callback)
    {
        await smsUtilityLogic.IncomingSms(callback);

        return Ok("received");
    }
}
