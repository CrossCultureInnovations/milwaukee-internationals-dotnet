using System.Threading.Tasks;
using DAL.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;

namespace DAL.Utilities;

[AllowAnonymous]
public class LogHub(ILogger<LogHub> logger, IApiEventService apiEventService) : Hub
{
    private readonly ILogger<LogHub> _logger = logger;

    public async Task Sink(object props)
    {
        await apiEventService.RecordEvent($"Mobile app log: {JsonConvert.SerializeObject(props)}");
    }
}