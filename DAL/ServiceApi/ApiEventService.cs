using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using DAL.Interfaces;
using DAL.Utilities;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using Models.ViewModels.EventService;

namespace DAL.ServiceApi;

public class ApiEventService(
    IConfigLogic configLogic,
    IHubContext<MessageHub> hubContext,
    ILogger<ApiEventService> logger)
    : IApiEventService
{
    private LinkedList<ApiEvent> _events = [];
    private const int QueryLimit = 35;

    public async Task RecordEvent(string description)
    {
        logger.LogTrace("{}", description);
        
        var entity = new ApiEvent
        {
            Description = description,
            RecordedDate = DateTimeOffset.Now,
            // This is needed to make sure events are added in reverse chronological order because azure blob storage doesn't have order by feature
            RowKey = (DateTimeOffset.MaxValue.Ticks - DateTimeOffset.Now.Ticks).ToString("d19"),
            PartitionKey = DateTimeOffset.Now.ToString("yyyy-MM-dd")
        };

        await hubContext.Clients.All.SendAsync("events", entity);
        var globalConfigs = await configLogic.ResolveGlobalConfig();

        if (globalConfigs.RecordApiEvents)
        {
            _events.AddFirst(entity);

            _events = new LinkedList<ApiEvent>(_events.Take(QueryLimit));
        }
    }

    public IEnumerable<ApiEvent> GetEvents()
    {
        return GetEvents(limit: QueryLimit);
    }

    private IEnumerable<ApiEvent> GetEvents(int limit)
    {
        return _events.Take(limit).ToList();
    }
}