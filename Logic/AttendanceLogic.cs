using System;
using System.Linq;
using System.Threading.Tasks;
using DAL.Interfaces;
using Logic.Interfaces;
using Models.Constants;
using Models.Entities;
using Models.ViewModels;

namespace Logic;

public class AttendanceLogic(
    IStudentLogic studentLogic,
    IDriverLogic driverLogic,
    IEmailServiceApi emailServiceApi,
    IApiEventService apiEventService)
    : IAttendanceLogic
{
    /// <summary>
    /// Set the attendance for student
    /// </summary>
    /// <param name="attendanceViewModel"></param>
    /// <returns></returns>
    public async Task<bool> StudentSetAttendance(AttendanceViewModel attendanceViewModel)
    {
        var student = await studentLogic.Update(attendanceViewModel.Id, x =>
        {
            // Set attendance
            x.IsPresent = attendanceViewModel.Attendance;
        });

        await apiEventService.RecordEvent(
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
        var driver = await driverLogic.Update(attendanceViewModel.Id, x =>
        {
            // Set attendance
            x.IsPresent = attendanceViewModel.Attendance;
        });

        await apiEventService.RecordEvent(
            $"Update driver [{driver.Fullname}] with ID: {driver.Id} attendance to {attendanceViewModel.Attendance}");
            
        return true;
    }

    /// <summary>
    /// Handles sending email to students so they check-in
    /// </summary>
    /// <returns></returns>
    public async Task<bool> HandleStudentSendCheckIn()
    {
        foreach (var x in await studentLogic.GetAll())
        {
            var email = BuildStudentCheckInEmail(x);

            await emailServiceApi.SendEmailAsync([email.To], email.Subject, email.Body);
        }

        await apiEventService.RecordEvent("Sent student check-in emails");
            
        return true;
    }

    /// <summary>
    /// Renders the check-in email for a single student, without sending it
    /// </summary>
    /// <param name="studentId">Student to render for, or null for the first one that would be sent to</param>
    /// <returns></returns>
    public async Task<EmailPreviewViewModel> PreviewStudentCheckInEmail(int? studentId)
    {
        var students = (await studentLogic.GetAll()).ToList();

        var student = studentId.HasValue
            ? students.FirstOrDefault(x => x.Id == studentId.Value)
            : students.FirstOrDefault();

        return student == null ? null : BuildStudentCheckInEmail(student);
    }

    /// <summary>
    /// Builds the check-in email for a student. Shared by sending and preview
    /// so the two can never disagree.
    /// </summary>
    /// <param name="student"></param>
    /// <returns></returns>
    private static EmailPreviewViewModel BuildStudentCheckInEmail(Student student)
    {
        var url = $"{ApiConstants.SiteUrl}/utility/EmailCheckIn/Student/{student.GenerateHash()}";

        return new EmailPreviewViewModel
        {
            To = student.Email,
            RecipientName = student.Fullname,
            Subject = "Tour Check-In",
            Body = $@"
                    <h4>Please use this link to check-in</h4>
                    <br>
                    <p><a href=""{url}"">Link</a> ({url})</p>
                    <br>
                    <p>Thank you</p>
                "
        };
    }

    /// <summary>
    /// Handles sending email to drivers so they check-in
    /// </summary>
    /// <returns></returns>
    public async Task<bool> HandleDriverSendCheckIn()
    {
        foreach (var x in await driverLogic.GetAll())
        {
            var email = BuildDriverCheckInEmail(x);

            await emailServiceApi.SendEmailAsync([email.To], email.Subject, email.Body);
        }

        await apiEventService.RecordEvent("Sent driver check-in emails");

        return true;
    }

    /// <summary>
    /// Renders the check-in email for a single driver, without sending it
    /// </summary>
    /// <param name="driverId">Driver to render for, or null for the first one that would be sent to</param>
    /// <returns></returns>
    public async Task<EmailPreviewViewModel> PreviewDriverCheckInEmail(int? driverId)
    {
        var drivers = (await driverLogic.GetAll()).ToList();

        var driver = driverId.HasValue
            ? drivers.FirstOrDefault(x => x.Id == driverId.Value)
            : drivers.FirstOrDefault();

        return driver == null ? null : BuildDriverCheckInEmail(driver);
    }

    /// <summary>
    /// Builds the check-in email for a driver. Shared by sending and preview so
    /// the two can never disagree.
    /// </summary>
    /// <param name="driver"></param>
    /// <returns></returns>
    private static EmailPreviewViewModel BuildDriverCheckInEmail(Driver driver)
    {
        var url = $"{ApiConstants.SiteUrl}/utility/EmailCheckIn/Driver/{driver.GenerateHash()}";

        return new EmailPreviewViewModel
        {
            To = driver.Email,
            RecipientName = driver.Fullname,
            Subject = $"Tour Driver Check-In and Host Info ({DateTime.UtcNow.Year})",
            Body = $@"
                    <h4>Hello {driver.Fullname},</h4>
                    <h4>Please use the following link to see details and to check-in</h4>
                    <p><a href=""{url}"">{url}</a></p>
                    <p>Most important thing to remember is your -Display ID-. Students are matched to this ID. The number next to your initials is unique.</p>
                    <p>The link has information about your host where you will go for dinner with students. </p>
                    <br>
                    <p>To save time when you arrive at UWM, just click on the button which says 'Check-In'. We will know that you are there and ready to drive students. Remember to pick up your Display ID when you arrive at the drivers area.</p>
                    <p>Reach out to us if there are issues.</p>
                    <p>Thank you</p>
                "
        };
    }
}