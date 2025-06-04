using System.Threading.Tasks;
using DAL.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;

namespace API.Controllers.API;

[AllowAnonymous]
[Route("api/[controller]")]
public class LogController(IApiEventService apiEventService, ILogger<LogController> logger)
    : Controller
{
    private readonly ILogger<LogController> _logger = logger;

    [HttpPost]
    [Route("")]
    public async Task<IActionResult> Record([FromBody]object log)
    {
        await apiEventService.RecordEvent($"Fallback http Mobile app log: {JsonConvert.SerializeObject(log)}");
        
        return Ok("Recorded");
    }
}