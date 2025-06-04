using System.Linq;
using System.Threading.Tasks;
using API.Attributes;
using Logic.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiExplorerSettings(IgnoreApi = true)]
[AuthorizeMiddleware]
[Route("[controller]")]
public class MappingController(IStudentLogic studentLogic, IDriverLogic driverLogic, ISmsUtilityLogic smsUtilityLogic)
    : Controller
{
    // GET the view
    [HttpGet]
    public IActionResult Index()
    {
        return View();
    }

    /// <summary>
    /// Returns Student-Driver Mapping view
    /// </summary>
    /// <returns></returns>
    [HttpGet]
    [Route("StudentDriverMapping")]
    public async Task<IActionResult> StudentDriverMapping()
    {
        var students = (await studentLogic.GetAll()).ToList();
            
        return View(students);
    }

    /// <summary>
    /// Returns Driver-Host Mapping view
    /// </summary>
    /// <returns></returns>
    [HttpGet]
    [Route("DriverHostMapping")]
    public async Task<IActionResult> DriverHostMapping()
    {
        var drivers = (await driverLogic.GetAll()).ToList();

        return View(drivers);
    }

    /// <summary>
    /// Host heads up SMS
    /// </summary>
    /// <returns></returns>
    [HttpGet]
    [Route("HostHeadsUpSms")]
    public async Task<IActionResult> HostHeadsUpSms()
    {
        await smsUtilityLogic.HandleHostSms();

        return RedirectToAction("DriverHostMapping");
    }
}
