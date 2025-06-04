using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using DAL.Interfaces;
using EnumsNET;
using Logic.Interfaces;
using Models.Enums;
using Models.ViewModels;

namespace Logic;

public class EmailUtilityLogic(
    IConfigLogic configLogic,
    IStudentLogic studentLogic,
    IDriverLogic driverLogic,
    IHostLogic hostLogic,
    IUserLogic userLogic,
    IEmailServiceApi emailServiceApiApi,
    IApiEventService apiEventService,
    IRegistrationLogic registrationLogic)
    : IEmailUtilityLogic
{
    public async Task<EmailFormViewModel> GetEmailForm()
    {
        var globalConfigs = await configLogic.ResolveGlobalConfig();
        
        var year = globalConfigs.YearValue;
            
        return new EmailFormViewModel
        {
            AdminCount = (await userLogic.GetAll()).Count(x => x.UserRoleEnum == UserRoleEnum.Admin),
            StudentCount = (await studentLogic.GetAll(year)).Count(),
            DriverCount = (await driverLogic.GetAll(year)).Count(),
            HostCount = (await hostLogic.GetAll(year)).Count(),
            UserCount = (await userLogic.GetAll()).Count()
        };
    }

    public async Task<bool> HandleEventEmail(EmailEventViewModel emailEventViewModel)
    {
        // Send the email
        await emailServiceApiApi.SendEmailAsync(emailEventViewModel.Emails, emailEventViewModel.Subject, emailEventViewModel.Body);

        await apiEventService.RecordEvent($"Sent form email [{emailEventViewModel.Subject}] to {string.Join(',', emailEventViewModel.Emails)}");

        return true;
    }
        
    /// <summary>
    /// Handles email form view model
    /// </summary>
    /// <param name="emailFormViewModel"></param>
    /// <returns></returns>
    public async Task<bool> HandleAdHocEmail(EmailFormViewModel emailFormViewModel)
    {
        var globalConfigs = await configLogic.ResolveGlobalConfig();

        var year = globalConfigs.YearValue;
            
        var emailAddresses = new List<string>();

        // Add admin email
        if (emailFormViewModel.Admin)
        {
            var admins = (await userLogic.GetAll()).Where(x => x.UserRoleEnum == UserRoleEnum.Admin)
                .Select(x => x.Email)
                .ToList();

            emailAddresses.AddRange(admins);
        }
            
        // Add student emails
        if (emailFormViewModel.Students)
        {
            var students = await studentLogic.GetAll(year);
            emailAddresses.AddRange(students.Select(x => x.Email).Where(x => !string.IsNullOrWhiteSpace(x)));
        }

        // Add driver emails
        if (emailFormViewModel.Drivers)
        {
            var drivers = await driverLogic.GetAll(year);
            emailAddresses.AddRange(drivers.Select(x => x.Email).Where(x => !string.IsNullOrWhiteSpace(x)));
        }
            
        // Add host emails
        if (emailFormViewModel.Hosts)
        {
            var hosts = await hostLogic.GetAll(year);
            emailAddresses.AddRange(hosts.Select(x => x.Email).Where(x => !string.IsNullOrWhiteSpace(x)));
        }
            
        // Add user emails
        if (emailFormViewModel.Users)
        {
            var users = await userLogic.GetAll();
            emailAddresses.AddRange(users.Select(x => x.Email).Where(x => !string.IsNullOrWhiteSpace(x)));
        }

        // Add additional emails
        if (!string.IsNullOrWhiteSpace(emailFormViewModel.AdditionalRecipients))
        {
            var emails = emailFormViewModel.AdditionalRecipients.Split(',').Select(x => x.Trim()).ToList();
            emailAddresses.AddRange(emails);
        }

        // Remove duplicates
        emailAddresses = emailAddresses.Distinct().ToList();

        // Send the email
        await emailServiceApiApi.SendEmailAsync(
            emailAddresses,
            emailFormViewModel.Subject, 
            emailFormViewModel.Message,
            await Task.WhenAll(emailFormViewModel.Files.Select(async f =>
            {
                var memoryStream = new MemoryStream();
                await f.CopyToAsync(memoryStream);
                var base64File = Convert.ToBase64String(memoryStream.ToArray());
                
                return (f.FileName, f.ContentType, base64File);
            })));

        await apiEventService.RecordEvent($"Sent ad-hoc email [{emailFormViewModel.Subject}] to {string.Join(',', emailAddresses)}");

        return true;
    }

    /// <summary>
    /// Check-In all via an email
    /// </summary>
    /// <param name="entitiesEnum"></param>
    /// <param name="id"></param>
    /// <param name="present"></param>
    /// <returns></returns>
    public async Task<bool> HandleEmailCheckIn(EntitiesEnum entitiesEnum, int id, bool present)
    {
        switch (entitiesEnum)
        {
            case EntitiesEnum.Student:
                await studentLogic.Update(id, student =>
                {
                    // Checked-in
                    student.IsPresent = present;
                });
                break;
            case EntitiesEnum.Driver:
                await driverLogic.Update(id, driver =>
                {
                    // Checked-in
                    driver.IsPresent = present;
                });
                break;
            default:
                throw new ArgumentOutOfRangeException(nameof(entitiesEnum), entitiesEnum, null);
        }
            
        await apiEventService.RecordEvent($"Handled [{entitiesEnum.GetName()}] check-in email response with ID: {id}");

        return true;
    }

    public async Task SendConfirmationEmail(EntitiesEnum rolesEnum)
    {
        var globalConfigs = await configLogic.ResolveGlobalConfig();

        var year = globalConfigs.YearValue;

        switch (rolesEnum)
        {
            case EntitiesEnum.Student:
                await Task.WhenAll((await studentLogic.GetAll(year))
                    .Select(student => registrationLogic.SendStudentEmail(student)));

                break;
            case EntitiesEnum.Driver:
                await Task.WhenAll((await driverLogic.GetAll(year))
                    .Select(driver => registrationLogic.SendDriverEmail(driver)));

                break;
            case EntitiesEnum.Host:
                await Task.WhenAll((await hostLogic.GetAll(year))
                    .Select(host => registrationLogic.SendHostEmail(host)));

                break;
            default:
                throw new ArgumentOutOfRangeException(nameof(rolesEnum), rolesEnum, null);
        }
    }
}