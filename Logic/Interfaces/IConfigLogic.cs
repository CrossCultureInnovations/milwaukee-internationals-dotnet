using System.Collections.Generic;
using System.Threading.Tasks;
using Models.ViewModels.Config;

namespace Logic.Interfaces
{
    public interface IConfigLogic
    {
        Task<GlobalConfigViewModel> ResolveGlobalConfig();

        Task SetGlobalConfig(GlobalConfigViewModel globalConfigViewModel);

        Task Refresh();

        IEnumerable<int> GetYears();
    }
}