using System.Threading.Tasks;
using API.Attributes;
using DAL.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Models.Entities;
using Models.ViewModels;
using Models.Enums;

namespace API.Controllers;

[ApiExplorerSettings(IgnoreApi = true)]
[Route("legacy/[controller]")]
[AuthorizeMiddleware]
public class ConfigController(IConfigLogic configLogic) : Controller
{
    [HttpGet]
    [Route("")]
    [AuthorizeMiddleware(UserRoleEnum.Admin)]
    public async Task<IActionResult> Index()
    {
        var result = await configLogic.ResolveGlobalConfig();
        result.CapSecretKey = string.Empty;
        return View(result);
    }
        
    [HttpPost]
    [Route("")]
    [AuthorizeMiddleware(UserRoleEnum.Admin)]
    public async Task<IActionResult> UpdateConfig(GlobalConfigModel globalConfigs)
    {
        if (string.IsNullOrWhiteSpace(globalConfigs.CapSecretKey))
        {
            globalConfigs.CapSecretKey = (await configLogic.ResolveGlobalConfig()).CapSecretKey;
        }

        await configLogic.SetGlobalConfig(globalConfigs);

        return RedirectToAction("Index");
    }
}