using System.Collections.Generic;
using System.Threading.Tasks;
using Models.ViewModels;

namespace DAL.Interfaces;

public interface IConfigLogic
{
    Task<GlobalConfigModel> ResolveGlobalConfig();

    Task SetGlobalConfig(GlobalConfigModel globalConfigs);

    IEnumerable<int> GetYears();
}