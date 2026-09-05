using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using DAL.Interfaces;
using Logic.Interfaces;
using Models.Entities;
using Models.Enums;
using Models.ViewModels;

namespace Logic;

public class StudentDriverMappingLogic : IStudentDriverMappingLogic
{
    private readonly IStudentLogic _studentLogic;
    private readonly IDriverLogic _driverLogic;
    private readonly IEmailServiceApi _emailServiceApi;
    private readonly IApiEventService _apiEventService;

    /// <summary>
    /// Student-Driver mapping logic
    /// </summary>
    /// <param name="studentLogic"></param>
    /// <param name="driverLogic"></param>
    /// <param name="emailServiceApi"></param>
    /// <param name="apiEventService"></param>
    public StudentDriverMappingLogic(IStudentLogic studentLogic, IDriverLogic driverLogic, IEmailServiceApi emailServiceApi, IApiEventService apiEventService)
    {
        _studentLogic = studentLogic;
        _driverLogic = driverLogic;
        _emailServiceApi = emailServiceApi;
        _apiEventService = apiEventService;
    }

    /// <summary>
    /// Logic to handle the mapping
    /// </summary>
    /// <param name="newStudentDriverMappingViewModel"></param>
    /// <returns></returns>
    public async Task<bool> MapStudentToDriver(NewStudentDriverMappingViewModel newStudentDriverMappingViewModel)
    {
        var driver = await _driverLogic.Get(newStudentDriverMappingViewModel.DriverId);
            
        // Save changes to driver
        var result = await _studentLogic.Update(newStudentDriverMappingViewModel.StudentId, x =>
        {
            // Add map
            x.Driver = driver;
            x.DriverRefId = driver.Id;
        }) != null;

        await _apiEventService.RecordEvent(
            $"Mapped student to driver {newStudentDriverMappingViewModel.StudentId} to {newStudentDriverMappingViewModel.DriverId}");

        return result;
    }

    /// <summary>
    /// Un-Map student from driver
    /// </summary>
    /// <param name="newStudentDriverMappingViewModel"></param>
    /// <returns></returns>
    public async Task<bool> UnMapStudentToDriver(NewStudentDriverMappingViewModel newStudentDriverMappingViewModel)
    {            
        // Save changes to driver
        var result = await _studentLogic.Update(newStudentDriverMappingViewModel.StudentId, x =>
        {
            // Remove map
            x.Driver = null;
            x.DriverRefId = null;
        }) != null;
            
        await _apiEventService.RecordEvent(
            $"Un-Mapped student to driver {newStudentDriverMappingViewModel.StudentId} to {newStudentDriverMappingViewModel.DriverId}");

        return result;
    }

    /// <summary>
    /// Returns the status of mappings
    /// </summary>
    /// <returns></returns>
    public async Task<StudentDriverMappingViewModel> MappingStatus()
    {
        var students = (await _studentLogic.GetAll()).ToList();
        var drivers = (await _driverLogic.GetAll()).Where(x => x.Role == RolesEnum.Driver).ToList();
            
        // TODO: add check to return only students that are present
        return new StudentDriverMappingViewModel
        {
            AvailableStudents = students.Where(x => x.Driver == null),
            AvailableDrivers = drivers.ToDictionary(x => x, x => 
            {
                // Count = to 1 + FamilySize
                var count = (x.Students ?? []).Select(st => 1 + st.FamilySize)
                    .DefaultIfEmpty(0)
                    .Sum();

                return x.Capacity > count;
            }).ToList(),
            MappedDrivers = drivers.Where(x => x.Students != null && x.Students.Any()),
            MappedStudents = students.Where(x => x.Driver != null)
        };
    }
        
    /// <summary>
    /// Emails the mappings to drivers
    /// </summary>
    /// <returns></returns>
    public async Task<bool> EmailMappings()
    {
        var drivers = await _driverLogic.GetAll(DateTime.UtcNow.Year);

        // Send the email to drivers
        var tasks = drivers.Select(x =>
        {
            var email = BuildMappingEmail(x);
            return _emailServiceApi.SendEmailAsync([email.To], email.Subject, email.Body);
        });

        await Task.WhenAll(tasks);

        await _apiEventService.RecordEvent("Sent student-driver mapping emails");

        // Return true
        return true;
    }

    /// <summary>
    /// Renders the mapping email for a single driver, without sending it
    /// </summary>
    /// <param name="driverId">Driver to render for, or null for the first one that would be sent to</param>
    /// <returns></returns>
    public async Task<EmailPreviewViewModel> PreviewMappingEmail(int? driverId)
    {
        var drivers = (await _driverLogic.GetAll(DateTime.UtcNow.Year)).ToList();

        var driver = driverId.HasValue
            ? drivers.FirstOrDefault(x => x.Id == driverId.Value)
            : drivers.FirstOrDefault();

        return driver == null ? null : BuildMappingEmail(driver);
    }

    /// <summary>
    /// Builds the mapping email for a driver. Shared by sending and preview so
    /// the two can never disagree.
    /// </summary>
    /// <param name="driver"></param>
    /// <returns></returns>
    private static EmailPreviewViewModel BuildMappingEmail(Driver driver)
    {
        return new EmailPreviewViewModel
        {
            To = driver.Email,
            RecipientName = driver.Fullname,
            Subject = "Tour of Milwaukee - Assigned Students",
            Body = $@"                 
        <br />                                                                    
        <p> Hello {driver.Fullname},</p>
        <p> Your Driver ID:<strong> {driver.DisplayId?.Split('-').Last()} </strong></p> 
        <p> Students: </p>                       
        <ul>                                                                    
            {string.Join(Environment.NewLine, driver.Students?.Select(student =>
                                                  $"<li>{student.Fullname} ({student.Country}){FamilySuffix(student)}</li>")
                                              ?? new List<string> { "<p>No student is assigned to you yet.</p>"})}                                                    
        </ul>
        <br />                                                                   
            {string.Join(Environment.NewLine, driver.Host != null ? new List<string>
            {
                $"<p> Host Name: {driver.Host?.Fullname} </p>",
                $"<p> Host Contact: {driver.Host?.Phone} </p>",
                $"<p> Host Address: {driver.Host?.Address} </p>"
            } : new List<string> { "<p>You are not assigned to a host home yet.</p>" })}
        <br />                                                                   
        <br />                                                                
        <p> For questions, comments and feedback, please contact Asher Imtiaz (414-499-5360).</p> 
        "
        };
    }

    /// <summary>
    /// Renders the family members joining a student, when there are any
    /// </summary>
    /// <param name="student"></param>
    /// <returns></returns>
    private static string FamilySuffix(Student student)
    {
        if (!student.IsFamily || student.FamilySize <= 0) return string.Empty;

        return $" + {student.FamilySize} family member{(student.FamilySize == 1 ? string.Empty : "s")}";
    }
}
