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
}