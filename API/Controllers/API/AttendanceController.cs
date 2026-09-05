using System.Threading.Tasks;
using API.Attributes;
using Logic.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Models.ViewModels;
using Swashbuckle.AspNetCore.Annotations;

namespace API.Controllers.API;

[AuthorizeMiddleware]
[Route("api/[controller]")]
public class AttendanceController(IAttendanceLogic attendanceLogic) : Controller
{
    [HttpPost]
    [Route("Student/SetAttendance")]
    [SwaggerOperation("SetAttendance")]
    public async Task<IActionResult> StudentSetAttendance([FromBody] AttendanceViewModel attendanceViewModel)
    {
        return Ok(await attendanceLogic.StudentSetAttendance(attendanceViewModel));
    }

    [HttpPost]
    [Route("Driver/SetAttendance")]
    [SwaggerOperation("SetAttendance")]
    public async Task<IActionResult> DriverSetAttendance([FromBody] AttendanceViewModel attendanceViewModel)
    {
        return Ok(await attendanceLogic.DriverSetAttendance(attendanceViewModel));
    }

    [HttpPost]
    [Route("Driver/SendCheckIn")]
    [SwaggerOperation("DriverSendCheckIn")]
    public async Task<IActionResult> DriverSendCheckIn()
    {
        return Ok(await attendanceLogic.HandleDriverSendCheckIn());
    }

    [HttpPost]
    [Route("Student/SendCheckIn")]
    [SwaggerOperation("StudentSendCheckIn")]
    public async Task<IActionResult> StudentSendCheckIn()
    {
        return Ok(await attendanceLogic.HandleStudentSendCheckIn());
    }

    /// <summary>
    /// Renders the check-in email for one student so it can be reviewed before sending
    /// </summary>
    /// <param name="recipientId">Student to render for, or omitted for the first one that would be sent to</param>
    /// <returns></returns>
    [HttpGet]
    [Route("Student/PreviewCheckIn")]
    [SwaggerOperation("PreviewStudentCheckIn")]
    public async Task<IActionResult> StudentPreviewCheckIn(int? recipientId)
    {
        var preview = await attendanceLogic.PreviewStudentCheckInEmail(recipientId);

        return preview == null ? NotFound() : Ok(preview);
    }

    /// <summary>
    /// Renders the check-in email for one driver so it can be reviewed before sending
    /// </summary>
    /// <param name="recipientId">Driver to render for, or omitted for the first one that would be sent to</param>
    /// <returns></returns>
    [HttpGet]
    [Route("Driver/PreviewCheckIn")]
    [SwaggerOperation("PreviewDriverCheckIn")]
    public async Task<IActionResult> DriverPreviewCheckIn(int? recipientId)
    {
        var preview = await attendanceLogic.PreviewDriverCheckInEmail(recipientId);

        return preview == null ? NotFound() : Ok(preview);
    }
}