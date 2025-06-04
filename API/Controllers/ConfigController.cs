using System.Threading.Tasks;
using API.Attributes;
using DAL.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Models.Entities;
using Models.Enums;

namespace API.Controllers;

[ApiExplorerSettings(IgnoreApi = true)]
[Route("[controller]")]
[AuthorizeMiddleware]
public class ConfigController(IConfigLogic configLogic) : Controller
{
    [HttpGet]
    [Route("")]
    public async Task<IActionResult> Index()
    {
        var result = await configLogic.ResolveGlobalConfig();
            
        return View(result);
    }
        
    [HttpPost]
    [Route("")]
    [AuthorizeMiddleware(UserRoleEnum.Admin)]
    public async Task<IActionResult> UpdateConfig(GlobalConfigs globalConfigs)
    {
        await configLogic.SetGlobalConfig(globalConfigs);

        return RedirectToAction("Index");
    }
}