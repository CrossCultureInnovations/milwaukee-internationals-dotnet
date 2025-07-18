using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using DAL.Interfaces;
using Logic.Interfaces;
using Logic.Utilities;
using Models.Constants;
using Models.Enums;
using Models.ViewModels;

namespace Logic;

public class SmsUtilityLogic(
    IConfigLogic configLogic,
    ISmsService smsService,
    IStudentLogic studentLogic,
    IDriverLogic driverLogic,
    IHostLogic hostLogic,
    IUserLogic userLogic,
    IEmailServiceApi emailServiceApi,
    IApiEventService apiEventService,
    IRegistrationLogic registrationLogic)
    : ISmsUtilityLogic
{
    public async Task<bool> HandleAdHocSms(SmsFormViewModel smsFormViewModel)
    {
        var globalConfigs = await configLogic.ResolveGlobalConfig();

        var year = globalConfigs.YearValue;
            
        var phoneNumbers = new List<string>();

        // Add admin email
        if (smsFormViewModel.Admin)
        {
            var admins = (await userLogic.GetAll())
                .Where(x => x.UserRoleEnum == UserRoleEnum.Admin)
                .Select(x => x.PhoneNumber)
                .ToList();

            phoneNumbers.AddRange(admins);
        }

        // Add student emails
        if (smsFormViewModel.Students)
        {
            var students = await studentLogic.GetAll(year);
            phoneNumbers.AddRange(students.Select(x => x.Phone).Where(x => !string.IsNullOrWhiteSpace(x)));
        }

        // Add driver emails
        if (smsFormViewModel.Drivers)
        {
            var drivers = await driverLogic.GetAll(year);
            phoneNumbers.AddRange(drivers.Select(x => x.Phone).Where(x => !string.IsNullOrWhiteSpace(x)));
        }
            
        // Add host emails
        if (smsFormViewModel.Hosts)
        {
            var hosts = await hostLogic.GetAll(year);
            phoneNumbers.AddRange(hosts.Select(x => x.Phone).Where(x => !string.IsNullOrWhiteSpace(x)));
        }
            
        // Add user emails
        if (smsFormViewModel.Users)
        {
            var users = await userLogic.GetAll();
            phoneNumbers.AddRange(users.Select(x => x.PhoneNumber).Where(x => !string.IsNullOrWhiteSpace(x)));
        }

        // Add additional emails
        if (!string.IsNullOrWhiteSpace(smsFormViewModel.AdditionalRecipients))
        {
            var emails = smsFormViewModel.AdditionalRecipients.Split(',').Select(x => x.Trim()).ToList();
            phoneNumbers.AddRange(emails);
        }
        
        // CC to website admin
        phoneNumbers.Add(ApiConstants.SitePhoneNumber);

        // Remove duplicates
        phoneNumbers = phoneNumbers.Distinct().ToList();

        // Send the email
        await smsService.SendMessage(phoneNumbers, smsFormViewModel.Message);

        await apiEventService.RecordEvent($"Sent ad-hoc SMS to {string.Join(',', phoneNumbers)}");

        return true;
    }

    public async Task<SmsFormViewModel> GetSmsForm()
    {
        var globalConfigs = await configLogic.ResolveGlobalConfig();

        var year = globalConfigs.YearValue;
            
        return new SmsFormViewModel
        {
            AdminCount = (await userLogic.GetAll()).Count(x => x.UserRoleEnum == UserRoleEnum.Admin),
            StudentCount = (await studentLogic.GetAll(year)).Count(),
            DriverCount = (await driverLogic.GetAll(year)).Count(),
            HostCount = (await hostLogic.GetAll(year)).Count(),
            UserCount = (await userLogic.GetAll()).Count()
        };
    }

    public async Task HandleDriverSms()
    {
        var globalConfigs = await configLogic.ResolveGlobalConfig();

        var year = globalConfigs.YearValue;

        foreach (var driver in await driverLogic.GetAll(year))
        {
            await registrationLogic.SendDriverSms(driver);
        }
    }

    public async Task HandleStudentSms()
    {
        var globalConfigs = await configLogic.ResolveGlobalConfig();

        var year = globalConfigs.YearValue;

        foreach (var student in await studentLogic.GetAll(year))
        {
            await registrationLogic.SendStudentSms(student);
        }
    }

    public async Task HandleHostSms()
    {
        var globalConfigs = await configLogic.ResolveGlobalConfig();
        
        var year = globalConfigs.YearValue;

        foreach (var host in await hostLogic.GetAll(year))
        {
            await registrationLogic.SendHostSms(host);
        }
    }
    
    public async Task IncomingSms(IncomingSmsViewModel request)
    {
        // Ignore spam messages
        if (request?.data?.payload?.is_spam ?? true)
        {
            return;
        }

        var users = (await userLogic.GetAll()).Select(x => (Role: "user", x.Fullname, Phone: x.PhoneNumber));
        var students = (await studentLogic.GetAll()).Select(x => (Role: "student", x.Fullname, x.Phone));
        var drivers = (await driverLogic.GetAll()).Select(x => (Role: "driver", x.Fullname, x.Phone));
        var hosts = (await hostLogic.GetAll()).Select(x => (Role: "host", x.Fullname, x.Phone));
        var everyone = users.Concat(students).Concat(drivers).Concat(hosts);

        var from = request.data?.payload?.from?.phone_number;
        var carrier = request.data?.payload?.from?.carrier;
        var body = request.data?.payload?.text;
        var normalizedFrom = RegistrationUtility.NormalizePhoneNumber(from);

        var find = everyone.FirstOrDefault(x => RegistrationUtility.NormalizePhoneNumber(x.Phone) == normalizedFrom);
        var middle = string.Empty;

        if (find != default)
        {
            middle = $"(from {find.Role} {find.Fullname})\n";
        }

        var text = $"SMS from {from} [{carrier}]\n" +
                   $"{middle}" +
                   $"{body}";

        var httpClient = new HttpClient();
        var responses = await Task.WhenAll(request.data!.payload!.media.Select(async x => (Media: x, Response: await httpClient.GetAsync(x.url))));

        var attachments = await Task.WhenAll(responses.Select(async x =>
        {
            var (media, response) = x;
            var fileBytes = await response.Content.ReadAsByteArrayAsync();
            var base64File = Convert.ToBase64String(fileBytes);
           
            return (media.url.LocalPath.Split('/').Last(), media.content_type, base64File);
        }));
        
        await emailServiceApi.SendEmailAsync(
            [ApiConstants.SiteEmail], 
            $"SMS received {middle}", 
            text,
            attachments);
    }
}
