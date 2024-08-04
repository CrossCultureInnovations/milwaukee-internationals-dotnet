using System.Threading.Tasks;
using API.Attributes;
using Logic.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Models.ViewModels;
using Swashbuckle.AspNetCore.Annotations;

namespace API.Controllers.API;

[AuthorizeMiddleware]
[Route("api/[controller]")]
public class AttendanceController : Controller
{
    private readonly IAttendanceLogic _attendanceLogic;

    public AttendanceController(IAttendanceLogic attendanceLogic)
    {
        _attendanceLogic = attendanceLogic;
    }

    [HttpPost]
    [Route("Student/SetAttendance")]
    [SwaggerOperation("SetAttendance")]
    public async Task<IActionResult> StudentSetAttendance([FromBody] AttendanceViewModel attendanceViewModel)
    {
        return Ok(await _attendanceLogic.StudentSetAttendance(attendanceViewModel));
    }

    [HttpPost]
    [Route("Driver/SetAttendance")]
    [SwaggerOperation("SetAttendance")]
    public async Task<IActionResult> DriverSetAttendance([FromBody] AttendanceViewModel attendanceViewModel)
    {
        return Ok(await _attendanceLogic.DriverSetAttendance(attendanceViewModel));
    }

    [HttpPost]
    [Route("Driver/SendCheckIn")]
    [SwaggerOperation("DriverSendCheckIn")]
    public async Task<IActionResult> DriverSendCheckIn()
    {
        return Ok(await _attendanceLogic.HandleDriverSendCheckIn());
    }

    [HttpPost]
    [Route("Student/SendCheckIn")]
    [SwaggerOperation("StudentSendCheckIn")]
    public async Task<IActionResult> StudentSendCheckIn()
    {
        return Ok(await _attendanceLogic.HandleStudentSendCheckIn());
    }
}