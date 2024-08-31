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
public class PlacesController : Controller
{
    private readonly ILocationLogic _locationLogic;

    public PlacesController(ILocationLogic locationLogic)
    {
        _locationLogic = locationLogic;
    }
    
    [HttpGet]
    [Route("{year:int?}")]
    public async Task<IActionResult> Place(int? year)
    {
        year ??= DateTime.Now.Year;
        
        return View((await _locationLogic.GetAll(year.Value)).ToList());
    }
}