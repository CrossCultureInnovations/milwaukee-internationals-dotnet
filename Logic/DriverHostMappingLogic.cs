using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using DAL.Interfaces;
using Logic.Interfaces;
using Models.Constants;
using Models.Entities;
using Models.Enums;
using Models.ViewModels;

namespace Logic;

public class DriverHostMappingLogic : IDriverHostMappingLogic
{
    private readonly IDriverLogic _driverLogic;
    private readonly IHostLogic _hostLogic;
    private readonly IEmailServiceApi _emailServiceApi;
    private readonly IApiEventService _apiEventService;

    /// <summary>
    /// Driver-Host mapping logic
    /// </summary>
    /// <param name="driverLogic"></param>
    /// <param name="hostLogic"></param>
    /// <param name="emailServiceApi"></param>
    /// <param name="apiEventService"></param>
    public DriverHostMappingLogic(IDriverLogic driverLogic, IHostLogic hostLogic, IEmailServiceApi emailServiceApi, IApiEventService apiEventService)
    {
        _driverLogic = driverLogic;
        _hostLogic = hostLogic;
        _emailServiceApi = emailServiceApi;
        _apiEventService = apiEventService;
    }

    /// <summary>
    /// Logic to handle the mapping
    /// </summary>
    /// <param name="newDriverHostMappingViewModel"></param>
    /// <returns></returns>
    public async Task<bool> MapDriverToHost(NewDriverHostMappingViewModel newDriverHostMappingViewModel)
    {
        var host = await _hostLogic.Get(newDriverHostMappingViewModel.HostId);

        // Save changes to driver
        var result = await _driverLogic.Update(newDriverHostMappingViewModel.DriverId, x =>
        {
            // Add map
            x.Host = host;
            x.HostRefId = host.Id;
        }) != null;
            
        await _apiEventService.RecordEvent(
            $"Mapped driver to host {newDriverHostMappingViewModel.DriverId} to {newDriverHostMappingViewModel.HostId}");

        return result;
    }

    /// <summary>
    /// Un-Map student from driver
    /// </summary>
    /// <param name="newDriverHostMappingViewModel"></param>
    /// <returns></returns>
    public async Task<bool> UnMapDriverToHost(NewDriverHostMappingViewModel newDriverHostMappingViewModel)
    {
        // Save changes to driver
        var result = await _driverLogic.Update(newDriverHostMappingViewModel.DriverId, x =>
        {
            // Remove map
            x.Host = null;
            x.HostRefId = null;
        }) != null;
            
        await _apiEventService.RecordEvent(
            $"Un-Mapped driver to host {newDriverHostMappingViewModel.DriverId} to {newDriverHostMappingViewModel.HostId}");

        return result;
    }

    /// <summary>
    /// Returns the status of mappings
    /// </summary>
    /// <returns></returns>
    public async Task<DriverHostMappingViewModel> MappingStatus()
    {
        var hosts = (await _hostLogic.GetAll()).ToList();
        var drivers = (await _driverLogic.GetAll()).Where(x => x.Role == RolesEnum.Driver).ToList();

        // TODO: add check to return only students that are present
        return new DriverHostMappingViewModel
        {
            AvailableHosts = hosts,
            AvailableDrivers = drivers.Where(x => x.Host == null),
            MappedDrivers = drivers.Where(x => x.Host != null),
            MappedHosts = hosts.Where(x => x.Drivers != null && x.Drivers.Count != 0)
        };
    }

    /// <summary>
    /// Emails the mappings to hosts
    /// </summary>
    /// <returns></returns>
    public async Task<bool> EmailMappings()
    {
        var hosts = await _hostLogic.GetAll(ApiConstants.CurrentYear);

        // Send the email to hosts
        var tasks = hosts.Select(x =>
        {
            var email = BuildMappingEmail(x);
            return _emailServiceApi.SendEmailAsync([email.To], email.Subject, email.Body);
        });

        await Task.WhenAll(tasks);
            
        await _apiEventService.RecordEvent("Sent driver-host mapping emails");
            
        // Return true
        return true;
    }

    /// <summary>
    /// Renders the mapping email for a single host, without sending it
    /// </summary>
    /// <param name="hostId">Host to render for, or null for the first one that would be sent to</param>
    /// <returns></returns>
    public async Task<EmailPreviewViewModel> PreviewMappingEmail(int? hostId)
    {
        var hosts = (await _hostLogic.GetAll(ApiConstants.CurrentYear)).ToList();

        var host = hostId.HasValue
            ? hosts.FirstOrDefault(x => x.Id == hostId.Value)
            : hosts.FirstOrDefault();

        return host == null ? null : BuildMappingEmail(host);
    }

    /// <summary>
    /// Reads as " - plus 2 family members" when the student is bringing family,
    /// so a host can see how many people to expect, not just how many students.
    /// </summary>
    /// <param name="student"></param>
    /// <returns></returns>
    private static string FamilySuffix(Student student)
    {
        if (!student.IsFamily || student.FamilySize <= 0)
        {
            return string.Empty;
        }

        return $" &mdash; plus {student.FamilySize} family member{(student.FamilySize == 1 ? string.Empty : "s")}";
    }

    /// <summary>
    /// Builds the mapping email for a host. Shared by sending and preview so
    /// the two can never disagree.
    /// </summary>
    /// <param name="host"></param>
    /// <returns></returns>
    private static EmailPreviewViewModel BuildMappingEmail(Host host)
    {
        return new EmailPreviewViewModel
        {
            To = host.Email,
            RecipientName = host.Fullname,
            Subject = "Tour of Milwaukee - Assigned Drivers",
            Body = $@"               
        <br />
        <p> Hello {host.Fullname}</p>                                                 
        {(host.Drivers != null && host.Drivers.Any() ? $@"
            <p>List of drivers and students assigned to your home</p>
            <ul>
                {string.Join(Environment.NewLine, host.Drivers?.Select(driver => $@"
                    <li>
                        <p>Driver: {driver.Fullname}</p>
                        {(!string.IsNullOrEmpty(driver.Navigator) ? $"<p>Navigator: {driver.Navigator}</p>" : string.Empty)}
                        <ul>
                            {string.Join(Environment.NewLine, driver.Students?.Select(student => $@"
                                <li>{student.Fullname} ({student.Country}){FamilySuffix(student)}</li>
                            ") ?? new List<string> { "<li>No student assigned to this driver yet.</li>"})}
                        </ul>
                    </li>
                ")!)}
            </ul>
        " : "<p>No driver is assigned to your home.</p>")}
        <br />                                                                     
        <br />                                                                     
        <p> Thank you for helping with the tour this year. Reply to this email will be sent automatically to the team.</p>      
        <p> For questions, comments and feedback, please contact Asher Imtiaz (414-499-5360) or Marie Wilke (414-852-5132).</p> 
        "
        };
    }
}