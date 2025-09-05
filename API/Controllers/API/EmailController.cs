using System.Threading.Tasks;
using DAL.Interfaces;
using DAL.ServiceApi;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace API.Controllers.API;

[Authorize]
[Route("api/[controller]")]
public class EmailController(IEmailServiceApi emailService, ILogger<EmailController> logger) : Controller
{
    [AllowAnonymous]
    [HttpPost]
    [Route("Callback")]
    public virtual async Task<IActionResult> Callback([FromBody] JToken body)
    {
        logger.LogInformation("Email callback Body={Body}", JsonConvert.SerializeObject(body));

        switch (body)
        {
            case JObject singleMailEvent:
                await emailService.Callback([singleMailEvent.ToObject<MailjetEvent>()!]);
                break;
            case JArray arrayMailEvent:
                await emailService.Callback(arrayMailEvent.ToObject<MailjetEvent[]>()!);
                break;
        }
        
        return Ok("Replied to callback");
    }
}