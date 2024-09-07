using System.Collections.Generic;
using System.Threading.Tasks;

namespace DAL.Interfaces;

public interface IEmailServiceApi
{
    Task SendEmailAsync(
        IEnumerable<string> emailAddresses,
        string emailSubject,
        string emailHtml,
        params (string filename, string contentType, string content)[] attachments);
}