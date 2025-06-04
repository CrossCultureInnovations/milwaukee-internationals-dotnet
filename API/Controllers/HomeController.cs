using System.Threading.Tasks;
using API.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[AllowAnonymous]
[Route("")]
[ApiExplorerSettings(IgnoreApi = true)]
public class HomeController(IHttpRequestUtilityBuilder httpRequestUtilityBuilder) : Controller
{
    public IActionResult Index()
    {
        return RedirectToAction("Student", "Registration");
        // return RedirectToAction("Index", "AdHocRegistration");
    }

    /// <summary>
    /// View page to register
    /// </summary>
    /// <returns></returns>
    [HttpGet]
    [Route("Register")]
    public IActionResult Register()
    {
        return Redirect("~/Identity/Register".ToLower());
    }
        
    /// <summary>
    /// View page to register
    /// </summary>
    /// <returns></returns>
    [HttpGet]
    [Route("Echo")]
    public async Task<IActionResult> Echo()
    {
        return Ok(await httpRequestUtilityBuilder.For(HttpContext).GetUserInfo());
    }
}