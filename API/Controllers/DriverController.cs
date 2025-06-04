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
public class DriverController(IDriverLogic driverLogic) : Controller
{
    /// <summary>
    /// Returns driver view
    /// </summary>
    /// <returns></returns>
    [HttpGet]
    [Route("")]
    public async Task<IActionResult> Index([FromQuery]string sortBy = null, [FromQuery]bool? descending = null)
    {
        return View(await driverLogic.GetAll(sortBy, descending));
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
        await driverLogic.Delete(id);

        return RedirectToAction("Index");
    }
        
    /// <summary>
    /// Edit a driver
    /// </summary>
    /// <param name="id"></param>
    /// <returns></returns>
    [HttpGet]
    [Route("Edit/{id:int}")]
    public async Task<IActionResult> EditView(int id)
    {
        var driver = await driverLogic.Get(id);

        return View("Edit", driver);
    }
        
    /// <summary>
    /// Edit a driver
    /// </summary>
    /// <param name="driver"></param>
    /// <returns></returns>
    [HttpPost]
    [Route("Edit")]
    public async Task<IActionResult> EditHandler(Driver driver)
    {
        await driverLogic.Update(driver.Id, driver);

        return RedirectToAction("Index");
    }
}