using System;
using System.Linq;
using System.Threading.Tasks;
using DAL.Interfaces;
using Flurl;
using Logic.Interfaces;
using Logic.Utilities;
using Models.Constants;
using Models.Entities;
using Models.Enums;
using Net.Codecrete.QrCodeGenerator;

namespace Logic;

public class RegistrationLogic(
    IStudentLogic studentLogic,
    IDriverLogic driverLogic,
    IHostLogic hostLogic,
    IEventLogic eventLogic,
    ILocationLogic locationLogic,
    IEmailServiceApi emailServiceApiApi,
    IApiEventService apiEventService,
    ISmsService smsService,
    IConfigLogic configLogic)
    : IRegistrationLogic
{
    public async Task SendStudentEmail(Student student)
    {
        var globalConfigs = await configLogic.ResolveGlobalConfig();
        
        const string rootUrl = ApiConstants.SiteUrl;
        var checkInPath = Url.Combine(rootUrl, "App", "CheckIn", "Student", student.GenerateHash());

        var qr = QrCode.EncodeText(checkInPath, QrCode.Ecc.High);
        var png = qr.ToPng(10, 3);

        var sigBase64 = Convert.ToBase64String(png);
        var qrUri = $"data:image/png;base64,{sigBase64}";

        await emailServiceApiApi.SendEmailAsync([student.Email], "Tour of Milwaukee Registration Confirmation",
            $@"
                    <p>Name: {student.Fullname}</p>
                    <p>University: {student.University}</p>
                    <p>Major: {student.Major}</p>
                    <p>Phone: {student.Phone}</p>
                    <hr>
                    <p>See you at the Tour of Milwaukee</p>
                    <p> Note that this is not a bus tour; it's a personal tour with 2-4 people in each vehicle. The tour concludes with a dinner at an American home. </p>
                    <br>
                    <p> {globalConfigs.TourDate.Year} Tour of Milwaukee</p>
                    <p> Date: {globalConfigs.TourDate:dddd, MMMM d, yyyy}</p>
                    <p> Time: {globalConfigs.TourDate:HH:mm}</p>
                    <p> Address: {globalConfigs.TourAddress} </p>
                    <p> Location: {globalConfigs.TourLocation} </p>
                    <p> Thank you for registering for this event. Please share this with other new international friends.</p>
                    <p> If you need any sort of help (furniture, etc.), please contact Asher Imtiaz (414-499-5360).</p>
                    <br>
                    {(globalConfigs.QrInStudentEmail ? @$"<br>
                    <p>Please save your QR code after your online registration. You can use the QR code when you check-in on the day of the Tour of Milwaukee.</p>
                    <img src=""{qrUri}"" alt=""QR code"" />" : "")}
                ");
    }

    public async Task SendDriverEmail(Driver driver)
    {
        var globalConfigs = await configLogic.ResolveGlobalConfig();

        switch (driver.Role)
        {
            case RolesEnum.Driver:
                await emailServiceApiApi.SendEmailAsync([driver.Email], "Tour of Milwaukee: Driver registration",
                    $@"
                    <p> Name: {driver.Fullname}</p>
                    <p> Role: {driver.Role}</p>
                    <p> Phone: {driver.Phone}</p>
                    <p> Capacity: {driver.Capacity}</p>
                    <p> Display Id: {driver.DisplayId}</p>
                    <p> Require Navigator: {(driver.RequireNavigator ? "Yes, navigator will be assigned to you" : $"No, my navigator is: {driver.Navigator}")}</p>
                    <br>
                    <p> {globalConfigs.TourDate.Year} Tour of Milwaukee</p>
                    <p> Date: {globalConfigs.TourDate:dddd, MMMM d, yyyy}</p>
                    <p> Time: {globalConfigs.TourDate:HH:mm} (Brief orientation only for drivers and navigators) </p>
                    <p> Address: {globalConfigs.TourAddress} </p>
                    <p> Location: {globalConfigs.TourLocation} </p>
                    <br>
                    <p> Thank you for helping with the tour this year.</p>
                    <p> For questions, comments and feedback, please contact Asher Imtiaz (414-499-5360) or Marie Wilke (414-852-5132).</p>
                    <br>
                    <p> Blessings, </p>
                ");
                break;
            default:
                throw new ArgumentOutOfRangeException();
        }
    }

    public async Task SendHostEmail(Host host)
    {
        var globalConfigs = await configLogic.ResolveGlobalConfig();

        await emailServiceApiApi.SendEmailAsync([host.Email], "Tour of Milwaukee: Host registration", $@"
                    <p>Name: {host.Fullname}</p>
                    <p>Address: {host.Address}</p>
                    <hr>
                    <p>Thank you for helping with hosting and welcoming Internationals to Milwaukee.</p>
                    <br>
                    <p> {globalConfigs.TourDate.Year} Tour of Milwaukee</p>
                    <p> Date: {globalConfigs.TourDate:dddd, MMMM d, yyyy}</p>
                    <p> Time: {globalConfigs.ArrivalTimeForHost:h:mm tt}</p>
                    <p> We will send you more details once we have them.</p>
                    <p> For questions, any change in plans, please contact Asher Imtiaz (414-499-5360).</p>
                    <p> Blessings,</p>
                ");
    }

    public async Task<bool> IsRegisterStudentOpen()
    {
        var globalConfigs = await configLogic.ResolveGlobalConfig();

        var year = DateTime.Now.Year;
        var count = await studentLogic.Count(x => x.Year == year);

        var overLimit = count >= globalConfigs.MaxLimitStudentSeats;

        var afterTour = await IsAfterTourDay();
        
        return !overLimit && !afterTour;
    }
    
    public async Task<bool> IsRegisterDriverOpen()
    {
        var globalConfigs = await configLogic.ResolveGlobalConfig();

        var year = DateTime.Now.Year;
        var count = await driverLogic.Count(x => x.Year == year);

        var overLimit = count >= globalConfigs.MaxLimitDrivers;
        var afterTour = await IsAfterTourDay();
        
        return !overLimit && !afterTour;
    }

    private async Task<bool> IsAfterTourDay()
    {
        var globalConfigs = await configLogic.ResolveGlobalConfig();

        return DateTime.Now.Subtract(globalConfigs.TourDate.AddDays(1)).Days > 0;
    }
    
    public async Task RegisterDriver(Driver driver)
    {
        driver = await driverLogic.Save(driver);

        // If save was successful
        if (driver != null)
        {
            await apiEventService.RecordEvent($"Driver {driver.Fullname} registered");

            await SendDriverEmail(driver);
        }
    }

    public async Task RegisterStudent(Student student)
    {
        student = await studentLogic.Save(student);

        // If save was successful
        if (student != null)
        {
            await apiEventService.RecordEvent($"Student {student.Fullname} registered");
            
            await SendStudentEmail(student);
        }
    }

    public async Task RegisterHost(Host host)
    {
        host = await hostLogic.Save(host);

        // If save was successful
        if (host != null)
        {
            await apiEventService.RecordEvent($"Host {host.Fullname} registered");

            await SendHostEmail(host);
        }
    }

    public async Task RegisterEvent(Event @event)
    {
        await eventLogic.Save(@event);
    }

    public async Task RegisterLocation(Location location)
    {
        await locationLogic.Save(location);
    }

    public async Task SendDriverSms(Driver driver)
    {
        var url = $"{ApiConstants.SiteUrl}/utility/EmailCheckIn/Driver/{driver.GenerateHash()}";

        var text = $"Asher here.Your display ID is {driver.DisplayId.Split('-')[1]}, link to check-in and see tour details {url}";
        
        await smsService.SendMessage(driver.Phone, text);
    }

    public async Task SendStudentSms(Student student)
    {
        var url = $"{ApiConstants.SiteUrl}/utility/EmailCheckIn/Student/{student.GenerateHash()}";

        var text = $"Asher here.Link to check-in and see tour details {url}";
        
        await smsService.SendMessage(student.Phone, text);
    }

    public async Task SendHostSms(Host host)
    {
        var text = $"Hi {host.Fullname}.You have {host.Drivers.Count} drivers coming " +
                   $"with {host.Drivers.Select(driver => driver.Students.Select(student => 1 + student.FamilySize).Sum()).Sum()} students (some have navigators). Asher.";

        await smsService.SendMessage(host.Phone, text);
    }
}
