using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Models.Enums;

namespace API.Controllers;

/// <summary>
///     App controller
/// </summary>
[AllowAnonymous]
[ApiExplorerSettings(IgnoreApi = true)]
[Route("[controller]")]
public class AppController : Controller
{
    [AllowAnonymous]
    [HttpGet]
    [Route("CheckIn/Student/{hashcode}")]
    public IActionResult StudentCheckIn([FromRoute] string hashcode)
    {
        return RedirectToAction("EmailCheckIn", "Utility", new
        {
            type = EntitiesEnum.Student, hashcode
        });
    }
}