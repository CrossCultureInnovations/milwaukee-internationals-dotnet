using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using DAL.Interfaces;
using Logic.Interfaces;
using Logic.Utilities;
using Models.Constants;
using Models.Enums;
using Models.ViewModels;

namespace Logic;

public class SmsUtilityLogic : ISmsUtilityLogic
{
    private readonly IConfigLogic _configLogic;
    private readonly ISmsService _smsService;
    private readonly IStudentLogic _studentLogic;
    private readonly IDriverLogic _driverLogic;
    private readonly IHostLogic _hostLogic;
    private readonly IUserLogic _userLogic;
    private readonly IEmailServiceApi _emailServiceApi;
    private readonly IApiEventService _apiEventService;
    private readonly IRegistrationLogic _registrationLogic;

    public SmsUtilityLogic(
        IConfigLogic configLogic,
        ISmsService smsService,
        IStudentLogic studentLogic,
        IDriverLogic driverLogic,
        IHostLogic hostLogic,
        IUserLogic userLogic,
        IEmailServiceApi emailServiceApi,
        IApiEventService apiEventService,
        IRegistrationLogic registrationLogic)
    {
        _configLogic = configLogic;
        _smsService = smsService;
        _studentLogic = studentLogic;
        _driverLogic = driverLogic;
        _hostLogic = hostLogic;
        _userLogic = userLogic;
        _emailServiceApi = emailServiceApi;
        _apiEventService = apiEventService;
        _registrationLogic = registrationLogic;
    }
    
    public async Task<bool> HandleAdHocSms(SmsFormViewModel smsFormViewModel)
    {
        var globalConfigs = await _configLogic.ResolveGlobalConfig();

        var year = globalConfigs.YearValue;
            
        var phoneNumbers = new List<string>();

        // Add admin email
        if (smsFormViewModel.Admin)
        {
            var admins = (await _userLogic.GetAll()).Where(x => x.UserRoleEnum == UserRoleEnum.Admin)
                .Select(x => x.Email)
                .ToList();

            phoneNumbers.AddRange(admins);
        }

        // Add student emails
        if (smsFormViewModel.Students)
        {
            var students = await _studentLogic.GetAll(year);
            phoneNumbers.AddRange(students.Select(x => x.Email).Where(x => !string.IsNullOrWhiteSpace(x)));
        }

        // Add driver emails
        if (smsFormViewModel.Drivers)
        {
            var drivers = await _driverLogic.GetAll(year);
            phoneNumbers.AddRange(drivers.Select(x => x.Email).Where(x => !string.IsNullOrWhiteSpace(x)));
        }
            
        // Add host emails
        if (smsFormViewModel.Hosts)
        {
            var hosts = await _hostLogic.GetAll(year);
            phoneNumbers.AddRange(hosts.Select(x => x.Email).Where(x => !string.IsNullOrWhiteSpace(x)));
        }
            
        // Add user emails
        if (smsFormViewModel.Users)
        {
            var users = await _userLogic.GetAll();
            phoneNumbers.AddRange(users.Select(x => x.Email).Where(x => !string.IsNullOrWhiteSpace(x)));
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
        await _smsService.SendMessage(phoneNumbers, smsFormViewModel.Message);

        await _apiEventService.RecordEvent($"Sent ad-hoc SMS to {string.Join(',', phoneNumbers)}");

        return true;
    }

    public async Task<SmsFormViewModel> GetSmsForm()
    {
        var globalConfigs = await _configLogic.ResolveGlobalConfig();

        var year = globalConfigs.YearValue;
            
        return new SmsFormViewModel
        {
            AdminCount = (await _userLogic.GetAll()).Count(x => x.UserRoleEnum == UserRoleEnum.Admin),
            StudentCount = (await _studentLogic.GetAll(year)).Count(),
            DriverCount = (await _driverLogic.GetAll(year)).Count(),
            HostCount = (await _hostLogic.GetAll(year)).Count(),
            UserCount = (await _userLogic.GetAll()).Count()
        };
    }

    public async Task HandleDriverSms()
    {
        var globalConfigs = await _configLogic.ResolveGlobalConfig();

        var year = globalConfigs.YearValue;

        foreach (var driver in await _driverLogic.GetAll(year))
        {
            await _registrationLogic.SendDriverSms(driver);
        }
    }

    public async Task HandleStudentSms()
    {
        var globalConfigs = await _configLogic.ResolveGlobalConfig();

        var year = globalConfigs.YearValue;

        foreach (var student in await _studentLogic.GetAll(year))
        {
            await _registrationLogic.SendStudentSms(student);
        }
    }

    public async Task HandleHostSms()
    {
        var globalConfigs = await _configLogic.ResolveGlobalConfig();
        
        var year = globalConfigs.YearValue;

        foreach (var host in await _hostLogic.GetAll(year))
        {
            await _registrationLogic.SendHostSms(host);
        }
    }
    
    public async Task IncomingSms(IncomingSmsViewModel request)
    {
        // Ignore spam messages
        if (request?.data?.payload?.is_spam ?? true)
        {
            return;
        }

        var users = (await _userLogic.GetAll()).Select(x => (Role: "user", x.Fullname, Phone: x.PhoneNumber));
        var students = (await _studentLogic.GetAll()).Select(x => (Role: "student", x.Fullname, x.Phone));
        var drivers = (await _driverLogic.GetAll()).Select(x => (Role: "driver", x.Fullname, x.Phone));
        var hosts = (await _hostLogic.GetAll()).Select(x => (Role: "host", x.Fullname, x.Phone));
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
        
        await _emailServiceApi.SendEmailAsync(ApiConstants.SiteEmail, $"SMS received {middle}", text);
    }
}
