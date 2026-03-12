using API.Attributes;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiExplorerSettings(IgnoreApi = true)]
[AuthorizeMiddleware]
[Route("legacy/[controller]")]
public class AttendanceController : Controller
{
    // GET
    [HttpGet]
    public IActionResult Index()
    {
        return View();
    }
        
    // GET
    [HttpGet]
    [Route("Student")]
    public IActionResult Student()
    {
        return View();
    }
        
    // GET
    [HttpGet]
    [Route("Driver")]
    public IActionResult Driver()
    {
        return View();
    }
}