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

public class LocationLogic(IEfRepository repository, IConfigLogic configLogic, IApiEventService apiEventService)
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

        return await base.Save(instance);
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