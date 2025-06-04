using API.Attributes;
using DAL.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Models.Enums;

namespace API.Controllers;

[ApiExplorerSettings(IgnoreApi = true)]
[AuthorizeMiddleware(UserRoleEnum.Admin)]
[Route("[controller]")]
public class ApiEventsController(IApiEventService apiEventService) : Controller
{
    [HttpGet]
    [Route("")]
    public IActionResult Index()
    {
        return View();
    }
    
    [HttpGet]
    [Route("latest")]
    public IActionResult GetLatestApiEvents()
    {
        return Ok(apiEventService.GetEvents());
    }
}