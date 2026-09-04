using System.Threading.Tasks;
using Models.ViewModels;
using SmsProxyHub.Contracts;

namespace Logic.Interfaces;

public interface ISmsUtilityLogic
{
    Task<bool> HandleAdHocSms(SmsFormViewModel smsFormViewModel);

    Task SendAdHocSms(string phoneNumber, string message);
    
    Task<SmsFormViewModel> GetSmsForm();
    
    Task HandleDriverSms();

    Task HandleStudentSms();

    Task HandleHostSms();
    
    Task IncomingSms(WebhookCallbackPayload callback);
}
