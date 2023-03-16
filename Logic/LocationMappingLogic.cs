using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;
using DAL.Interfaces;
using EfCoreRepository.Interfaces;
using Logic.Abstracts;
using Logic.Interfaces;
using Models.Constants;
using Models.Entities;

namespace Logic;

public class LocationMappingLogic :  BasicCrudLogicAbstract<LocationMapping>, ILocationMappingLogic
{
    private readonly IBasicCrud<LocationMapping> _dal;
    private readonly ILocationLogic _locationLogic;
    private readonly GlobalConfigs _globalConfigs;
    private readonly IApiEventService _apiEventService;

    /// <summary>
    /// Constructor dependency injection
    /// </summary>
    /// <param name="repository"></param>
    /// <param name="locationLogic"></param>
    /// <param name="globalConfigs"></param>
    /// <param name="apiEventService"></param>
    public LocationMappingLogic(IEfRepository repository, ILocationLogic locationLogic ,GlobalConfigs globalConfigs, IApiEventService apiEventService)
    {
        _dal = repository.For<LocationMapping>();
        _locationLogic = locationLogic;
        _globalConfigs = globalConfigs;
        _apiEventService = apiEventService;
    }

    protected override IBasicCrud<LocationMapping> Repository()
    {
        return _dal;
    }

    protected override IApiEventService ApiEventService()
    {
        return _apiEventService;
    }
    
    private static bool IsCyclicUtil(
        Dictionary<Location, List<Location>> graph,
        Location location,
        Dictionary<Location, bool> visited,
        Dictionary<Location, bool> recStack)
    {
        // Mark the current node as visited and
        // part of recursion stack
        if (recStack[location])
            return true;

        if (visited[location])
            return false;

        visited[location] = true;
        recStack[location] = true;

        var children = graph[location];

        if (children.Any(child => IsCyclicUtil(graph, child, visited, recStack)))
        {
            return true;
        }

        recStack[location] = false;

        return false;
    }

    private async Task<bool> IsCyclic(List<LocationMapping> mappings)
    {
        var locations = (await _locationLogic.GetAll()).ToList();
        var graph = locations.ToDictionary(x => x, _ => new List<Location>());
        
        foreach (var mapping in mappings)
        {
            mapping.Source = locations.FirstOrDefault(x => x.Id == mapping.SourceId);
            mapping.Sink = locations.FirstOrDefault(x => x.Id == mapping.SinkId);
        }
        
        foreach (var location in locations)
        {
            foreach (var locationMapping in mappings.Where(x => x.SourceId == location.Id))
            {
                graph[location].Add(locationMapping.Sink);
            }
        }

        // Mark all the vertices as not visited and
        // not part of recursion stack
        var visited = locations.ToDictionary(x => x, _ => false);
        var recStack = locations.ToDictionary(x => x, _ => false);

        // Call the recursive helper function to
        // detect cycle in different DFS trees
        return locations.Any(location => IsCyclicUtil(graph, location, visited, recStack));
    }
    
    public override async Task<LocationMapping> Save(LocationMapping instance)
    {
        if (instance.SourceId == instance.SinkId)
        {
            throw new Exception("Source and target are the same");
        }

        var existingMappings = (await GetAll()).ToList();

        if (existingMappings.Any(x => x.SourceId == instance.SourceId && x.SinkId == instance.SinkId))
        {
            throw new Exception("Duplicate mapping is not allowed");
        }
        
        var mappings = existingMappings.Concat(new[] { instance }).ToList();

        if (await IsCyclic(mappings))
        {
            throw new Exception("Adding this mapping introduces a cycle");
        }

        instance.Year = DateTime.Now.Year;

        return await base.Save(instance);
    }

    public override async Task<LocationMapping> Update(int id, LocationMapping updatedInstance)
    {
        if (updatedInstance.SourceId == updatedInstance.SinkId)
        {
            throw new Exception("Source and target are the same");
        }

        var existingMappings = (await GetAll()).Where(x => x.Id != id).ToList();

        if (existingMappings.Any(x => x.SourceId == updatedInstance.SourceId && x.SinkId == updatedInstance.SinkId))
        {
            throw new Exception("Duplicate mapping is not allowed");
        }
        
        var mappings = existingMappings.Concat(new[] { updatedInstance }).ToList();

        if (await IsCyclic(mappings))
        {
            throw new Exception("Updating this mapping introduces a cycle");
        }

        return await base.Update(id, updatedInstance);
    }
    
    public override async Task<IEnumerable<LocationMapping>> GetAll(string sortBy = null, bool? descending = null, params Expression<Func<LocationMapping, bool>>[] filters)
    {
        Expression<Func<LocationMapping, bool>> yearFilterExpr = x => x.Year == _globalConfigs.YearValue;

        return await base.GetAll(sortBy, descending, new [] {yearFilterExpr}.Concat(filters).ToArray());
    }
}