using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using DAL.Interfaces;
using DAL.Utilities;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using Models.ViewModels.EventService;

namespace DAL.ServiceApi;

public class ApiEventService(
    IHttpContextAccessor httpContextAccessor,
    IConfigLogic configLogic,
    IHubContext<MessageHub> hubContext,
    ILogger<ApiEventService> logger)
    : IApiEventService
{
    private static readonly Queue<ApiEvent> Events = new();
    private static readonly object EventsLock = new();
    private const int QueryLimit = 55;

    public async Task RecordEvent(string description)
    {
        logger.LogTrace("{}", description);
        
        var user = httpContextAccessor.HttpContext?.User.Identity?.Name ?? "anonymous";
        
        var entity = new ApiEvent
        {
            Description = $"[{user}] {description}",
            RecordedDate = DateTimeOffset.Now,
            // This is needed to make sure events are added in reverse chronological order because azure blob storage doesn't have order by feature
            RowKey = (DateTimeOffset.MaxValue.Ticks - DateTimeOffset.Now.Ticks).ToString("d19"),
            PartitionKey = DateTimeOffset.Now.ToString("yyyy-MM-dd")
        };

        await hubContext.Clients.All.SendAsync("events", entity);
        var globalConfigs = await configLogic.ResolveGlobalConfig();

        if (globalConfigs.RecordApiEvents)
        {
            lock (EventsLock)
            {
                Events.Enqueue(entity);

                while (Events.Count > QueryLimit)
                {
                    Events.Dequeue();
                }
            }
        }
    }

    public IEnumerable<ApiEvent> GetEvents()
    {
        return GetEvents(limit: QueryLimit);
    }

    private IEnumerable<ApiEvent> GetEvents(int limit)
    {
        lock (EventsLock)
        {
            return Events.Reverse().Take(limit).ToList();
        }
    }
}