using System;
using System.Threading.Tasks;
using DAL.Interfaces;
using Logic.Interfaces;
using Models.Constants;
using Models.ViewModels;

namespace Logic;

public class AttendanceLogic : IAttendanceLogic
{
    private readonly IStudentLogic _studentLogic;
    private readonly IDriverLogic _driverLogic;
    private readonly IEmailServiceApi _emailServiceApi;
    private readonly IApiEventService _apiEventService;

    public AttendanceLogic(IStudentLogic studentLogic, IDriverLogic driverLogic, IEmailServiceApi emailServiceApi, IApiEventService apiEventService)
    {
        _studentLogic = studentLogic;
        _driverLogic = driverLogic;
        _emailServiceApi = emailServiceApi;
        _apiEventService = apiEventService;
    }
        
    /// <summary>
    /// Set the attendance for student
    /// </summary>
    /// <param name="attendanceViewModel"></param>
    /// <returns></returns>
    public async Task<bool> StudentSetAttendance(AttendanceViewModel attendanceViewModel)
    {
        var student = await _studentLogic.Update(attendanceViewModel.Id, x =>
        {
            // Set attendance
            x.IsPresent = attendanceViewModel.Attendance;
        });

        await _apiEventService.RecordEvent(
            $"Update student [{student.Fullname}] with ID: {student.Id} attendance to {attendanceViewModel.Attendance}");

        return true;
    }

    /// <summary>
    /// Set the attendance for driver
    /// </summary>
    /// <param name="attendanceViewModel"></param>
    /// <returns></returns>
    public async Task<bool> DriverSetAttendance(AttendanceViewModel attendanceViewModel)
    {
        // Set attendance
        var driver = await _driverLogic.Update(attendanceViewModel.Id, x =>
        {
            // Set attendance
            x.IsPresent = attendanceViewModel.Attendance;
        });

        await _apiEventService.RecordEvent(
            $"Update driver [{driver.Fullname}] with ID: {driver.Id} attendance to {attendanceViewModel.Attendance}");
            
        return true;
    }

    /// <summary>
    /// Handles sending email to students so they check-in
    /// </summary>
    /// <returns></returns>
    public async Task<bool> HandleStudentSendCheckIn()
    {
        foreach (var x in await _studentLogic.GetAll())
        {
            var url = $"{ApiConstants.SiteUrl}/utility/EmailCheckIn/Student/{x.GenerateHash()}";
                
            await _emailServiceApi.SendEmailAsync(new []{ x.Email }, "Tour Check-In", $@"
                    <h4>Please use this link to check-in</h4>
                    <br>
                    <p><a href=""{url}"">Link</a> ({url})</p>
                    <br>
                    <p>Thank you</p>
                ");
        }

        await _apiEventService.RecordEvent("Sent student check-in emails");
            
        return true;
    }

    /// <summary>
    /// Handles sending email to drivers so they check-in
    /// </summary>
    /// <returns></returns>
    public async Task<bool> HandleDriverSendCheckIn()
    {
        foreach (var x in await _driverLogic.GetAll())
        {
            var url = $"{ApiConstants.SiteUrl}/utility/EmailCheckIn/Driver/{x.GenerateHash()}";
                
            await _emailServiceApi.SendEmailAsync(new []{ x.Email }, $"Tour Driver Check-In and Host Info ({DateTime.UtcNow.Year})", $@"
                    <h4>Hello {x.Fullname},</h4>
                    <h4>Please use the following link to see details and to check-in</h4>
                    <p><a href=""{url}"">{url}</a></p>
                    <p>Most important thing to remember is your -Display ID-. Students are matched to this ID. The number next to your initials is unique.</p>
                    <p>The link has information about your host where you will go for dinner with students. </p>
                    <br>
                    <p>To save time when you arrive at UWM, just click on the button which says 'Check-In'. We will know that you are there and ready to drive students. Remember to pick up your Display ID when you arrive at the drivers area.</p>
                    <p>Reach out to us if there are issues.</p>
                    <p>Thank you</p>
                ");
        }

        await _apiEventService.RecordEvent("Sent driver check-in emails");

        return true;
    }
}