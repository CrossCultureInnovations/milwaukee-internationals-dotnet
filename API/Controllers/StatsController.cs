using System.Threading.Tasks;
using API.Attributes;
using Logic.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Models.Enums;

namespace API.Controllers;

[ApiExplorerSettings(IgnoreApi = true)]
[AuthorizeMiddleware(UserRoleEnum.Admin)]
[Route("[controller]")]
public class StatsController(IStatsLogic statsLogic) : Controller
{
    [HttpGet]
    [Route("")]
    public async Task<IActionResult> Index()
    {
        return View(await statsLogic.GetStats());
    }

    [HttpGet]
    [Route("CountryDistribution")]
    public async Task<IActionResult> GetCountryDistribution()
    {
        return Ok(await statsLogic.GetCountryDistribution());
    }
}