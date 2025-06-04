using System;
using System.Linq;
using System.Threading.Tasks;
using Logic.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiExplorerSettings(IgnoreApi = true)]
[AllowAnonymous]
[Route("[controller]")]
public class PlacesController(ILocationLogic locationLogic) : Controller
{
    [HttpGet]
    [Route("{year:int?}")]
    public async Task<IActionResult> Place(int? year)
    {
        year ??= DateTime.Now.Year;
        
        var model = ((await locationLogic.GetAll(year.Value)).ToList(), year.Value);
        
        return View(model);
    }
}