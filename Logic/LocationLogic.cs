using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;
using DAL.Interfaces;
using EfCoreRepository.Interfaces;
using Logic.Abstracts;
using Logic.Interfaces;
using Models.Entities;

namespace Logic;

public class LocationLogic(
    IEfRepository repository,
    IConfigLogic configLogic,
    IApiEventService apiEventService,
    IGeocodingService geocodingService)
    : BasicCrudLogicAbstract<Location>, ILocationLogic
{
    private readonly IBasicCrud<Location> _dal = repository.For<Location>();

    protected override IBasicCrud<Location> Repository()
    {
        return _dal;
    }

    protected override IApiEventService ApiEventService()
    {
        return apiEventService;
    }

    public override async Task<Location> Save(Location instance)
    {
        var locations = await GetAll();

        instance.Rank = locations.Count() + 1;
        instance.Year = DateTime.Now.Year;

        var coordinates = await geocodingService.Resolve(instance.Address, instance.Name);

        instance.Latitude = coordinates?.Latitude;
        instance.Longitude = coordinates?.Longitude;

        return await base.Save(instance);
    }

    /// <summary>
    /// Re-geocodes when the address changes. An unchanged address keeps whatever pin it has, which
    /// is what preserves a position corrected by hand on the map.
    /// </summary>
    public override async Task<Location> Update(int id, Location updatedInstance)
    {
        var existing = await Get(id);

        var result = await base.Update(id, updatedInstance);

        if (existing == null || AddressesMatch(existing.Address, updatedInstance.Address))
        {
            return result;
        }

        // A failed lookup clears the pin rather than leaving the old address's coordinates behind,
        // so the location surfaces as unmapped instead of sitting somewhere wrong.
        var coordinates = await geocodingService.Resolve(updatedInstance.Address, updatedInstance.Name);

        return await Repository().Update(id, location =>
        {
            location.Latitude = coordinates?.Latitude;
            location.Longitude = coordinates?.Longitude;
        });
    }

    public async Task<GeocodeSummary> GeocodeMissing(int limit = 10)
    {
        var missing = (await GetAll())
            .Where(location => location.Latitude == null || location.Longitude == null)
            .ToList();

        var batch = missing.Take(limit).ToList();
        var geocoded = 0;

        foreach (var location in batch)
        {
            var coordinates = await geocodingService.Resolve(location.Address, location.Name);

            if (coordinates == null) continue;

            await Repository().Update(location.Id, entity =>
            {
                entity.Latitude = coordinates.Latitude;
                entity.Longitude = coordinates.Longitude;
            });

            geocoded++;
        }

        return new GeocodeSummary(
            batch.Count,
            geocoded,
            batch.Count - geocoded,
            missing.Count - geocoded);
    }

    public async Task<Location> SetCoordinates(int id, double latitude, double longitude)
    {
        return await Repository().Update(id, location =>
        {
            location.Latitude = latitude;
            location.Longitude = longitude;
        });
    }

    private static bool AddressesMatch(string left, string right)
    {
        return string.Equals(left?.Trim(), right?.Trim(), StringComparison.OrdinalIgnoreCase);
    }

    public override async Task<IEnumerable<Location>> GetAll(string sortBy = null, bool? descending = null, Func<object, string, object> sortByModifier = null, params Expression<Func<Location, bool>>[] filters)
    {
        var globalConfigs = await configLogic.ResolveGlobalConfig();

        Expression<Func<Location, bool>> yearFilterExpr = x => x.Year == globalConfigs.YearValue;

        return await base.GetAll(sortBy ?? "Rank", descending, null, new [] {yearFilterExpr}.Concat(filters).ToArray());
    }

    public async Task MoveRankUp(int id)
    {
        var source = await Get(id);
        
        if (source == null) return;

        foreach (var entity in await GetAll())
        {
            if (entity.Rank == source.Rank - 1)
            {
                await _dal.Update(entity.Id, x => x.Rank++);
                
                await _dal.Update(source.Id, x => x.Rank--);
                
                break;
            }
        }
    }

    public async Task MoveRankDown(int id)
    {
        var source = await Get(id);
        
        if (source == null) return;

        foreach (var entity in await GetAll())
        {
            if (entity.Rank == source.Rank + 1)
            {
                await _dal.Update(entity.Id, x => x.Rank--);
                
                await _dal.Update(source.Id, x => x.Rank++);
                
                break;
            }
        }
    }
}