using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using DAL.Interfaces;
using EfCoreRepository.Interfaces;
using Models.Entities;

namespace DAL;

public class ConfigLogic(IEfRepository efRepository) : IConfigLogic
{
    /// <summary>
    /// This is the year when milwaukee-internationals started
    /// </summary>
    private const int StartYear = 2017; // DO-NOT CHANGE!

    private readonly IBasicCrud<GlobalConfigs> _globalConfigCrud = efRepository.For<GlobalConfigs>();

    public async Task<GlobalConfigs> ResolveGlobalConfig()
    {
        return (await _globalConfigCrud.GetAll()).First();
    }

    public async Task SetGlobalConfig(GlobalConfigs globalConfigs)
    {
        await _globalConfigCrud.Update(globalConfigs.Id, globalConfigs);
    }

    public IEnumerable<int> GetYears()
    {
        var currentYear = StartYear;
        while (currentYear <= DateTime.Now.Year)
        {
            yield return currentYear;
            currentYear++;
        }
    }
}