using System.Collections.Generic;
using System.Threading.Tasks;
using DAL.ServiceApi;

namespace DAL.Interfaces;

public interface IEmailServiceApi
{
    Task SendEmailAsync(
        IEnumerable<string> emailAddresses,
        string emailSubject,
        string emailHtml,
        params (string filename, string contentType, string content)[] attachments);

    Task<MailSenderRegistrationStatus> IsSenderRegistered(string email);

    Task Callback(MailjetEvent[] body);
}