using System.Threading.Tasks;
using API.Attributes;
using Logic.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Models.Entities;
using Models.Enums;

namespace API.Controllers;

[ApiExplorerSettings(IgnoreApi = true)]
[AuthorizeMiddleware]
[Route("[controller]")]
public class HostController(IHostLogic hostLogic) : Controller
{
    /// <summary>
    /// Returns driver view
    /// </summary>
    /// <returns></returns>
    [HttpGet]
    [Route("")]
    public async Task<IActionResult> Index([FromQuery]string sortBy = null, [FromQuery]bool? descending = null)
    {
        return View(await hostLogic.GetAll(sortBy, descending));
    }
        
    /// <summary>
    /// Delete a driver
    /// </summary>
    /// <param name="id"></param>
    /// <returns></returns>
    [HttpGet]
    [Route("Delete/{id:int}")]
    [AuthorizeMiddleware(UserRoleEnum.Admin)]
    public async Task<IActionResult> Delete(int id)
    {
        await hostLogic.Delete(id);

        return RedirectToAction("Index");
    }
        
    /// <summary>
    /// Edit a host
    /// </summary>
    /// <param name="id"></param>
    /// <returns></returns>
    [HttpGet]
    [Route("Edit/{id:int}")]
    [AuthorizeMiddleware(UserRoleEnum.Admin)]
    public async Task<IActionResult> EditView(int id)
    {
        var driver = await hostLogic.Get(id);

        return View("Edit", driver);
    }
        
    /// <summary>
    /// Edit a host
    /// </summary>
    /// <param name="host"></param>
    /// <returns></returns>
    [HttpPost]
    [Route("Edit")]
    [AuthorizeMiddleware(UserRoleEnum.Admin)]
    public async Task<IActionResult> EditHandler(Host host)
    {
        await hostLogic.Update(host.Id, host);

        return RedirectToAction("Index");
    }
}