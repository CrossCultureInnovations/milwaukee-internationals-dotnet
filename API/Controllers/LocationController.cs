using System.Threading.Tasks;
using API.Attributes;
using Logic.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Models.Entities;
using Models.Enums;

namespace API.Controllers;

[ApiExplorerSettings(IgnoreApi = true)]
[AuthorizeMiddleware(UserRoleEnum.Admin)]
[Route("[controller]")]
public class LocationController(ILocationLogic locationLogic) : Controller
{
    /// <summary>
    /// Returns location view
    /// </summary>
    /// <returns></returns>
    [HttpGet]
    [Route("")]
    public async Task<IActionResult> Index([FromQuery]string sortBy = null, [FromQuery]bool? descending = null)
    {
        return View(await locationLogic.GetAll(sortBy, descending));
    }
        
    /// <summary>
    /// Delete a location
    /// </summary>
    /// <param name="id"></param>
    /// <returns></returns>
    [HttpGet]
    [Route("Delete/{id:int}")]
    [AuthorizeMiddleware(UserRoleEnum.Admin)]
    public async Task<IActionResult> Delete(int id)
    {
        await locationLogic.Delete(id);

        return RedirectToAction("Index");
    }
        
    /// <summary>
    /// Edit a location
    /// </summary>
    /// <param name="id"></param>
    /// <returns></returns>
    [HttpGet]
    [Route("Edit/{id:int}")]
    public async Task<IActionResult> EditView(int id)
    {
        var driver = await locationLogic.Get(id);

        return View("Edit", driver);
    }
        
    /// <summary>
    /// Edit a location
    /// </summary>
    /// <param name="location"></param>
    /// <returns></returns>
    [HttpPost]
    [Route("Edit")]
    public async Task<IActionResult> EditHandler(Location location)
    {
        await locationLogic.Update(location.Id, location);

        return RedirectToAction("Index");
    }
    
    [HttpGet]
    [Route("Edit/{id:int}/Rank/Up")]
    public async Task<IActionResult> MoveRankUp([FromRoute] int id)
    {
        await locationLogic.MoveRankUp(id);

        return RedirectToAction("Index");
    }
    
    [HttpGet]
    [Route("Edit/{id:int}/Rank/Down")]
    public async Task<IActionResult> MoveRankDown([FromRoute] int id)
    {
        await locationLogic.MoveRankDown(id);

        return RedirectToAction("Index");
    }
}