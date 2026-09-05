using System.Threading.Tasks;
using API.Attributes;
using Logic.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Models.Enums;

namespace API.Controllers.API;

[AuthorizeMiddleware(UserRoleEnum.Admin)]
[Route("api/[controller]")]
public class SmsController(ISmsUtilityLogic smsUtilityLogic) : Controller
{
    [HttpPost]
    [Route("")]
    public async Task<IActionResult> Send([FromBody] SendSmsRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.PhoneNumber))
        {
            return BadRequest(new { error = "Phone number is required." });
        }

        if (string.IsNullOrWhiteSpace(request.Message))
        {
            return BadRequest(new { error = "Message is required." });
        }

        if (request.Message.Length > 160)
        {
            return BadRequest(new { error = "Message cannot exceed 160 characters." });
        }

        await smsUtilityLogic.SendAdHocSms(request.PhoneNumber.Trim(), request.Message.Trim());

        return Ok(new { message = "SMS sent successfully." });
    }

    /// <summary>
    /// Texts every driver their check-in link
    /// </summary>
    /// <returns></returns>
    [HttpPost]
    [Route("Driver/SendCheckIn")]
    public async Task<IActionResult> DriverSendCheckIn()
    {
        await smsUtilityLogic.HandleDriverSms();

        return Ok(new { message = "Check-in texts sent to drivers." });
    }

    /// <summary>
    /// Texts every student their check-in link
    /// </summary>
    /// <returns></returns>
    [HttpPost]
    [Route("Student/SendCheckIn")]
    public async Task<IActionResult> StudentSendCheckIn()
    {
        await smsUtilityLogic.HandleStudentSms();

        return Ok(new { message = "Check-in texts sent to students." });
    }
}

public record SendSmsRequest(string PhoneNumber, string Message);