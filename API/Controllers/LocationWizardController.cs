using System;
using System.Linq;
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
public class LocationWizardController : Controller
{
    private readonly ILocationMappingLogic _locationMappingLogic;
    private readonly ILocationLogic _locationLogic;

    public LocationWizardController(ILocationMappingLogic locationMappingLogic, ILocationLogic locationLogic)
    {
        _locationMappingLogic = locationMappingLogic;
        _locationLogic = locationLogic;
    }
 
    /// <summary>
    /// Returns location mapping view
    /// </summary>
    /// <returns></returns>
    [HttpGet]
    [Route("")]
    public async Task<IActionResult> Index()
    {
        var locationMappings = (await _locationMappingLogic.GetAll()).ToList();
        var locations = (await _locationLogic.GetAll()).ToList();
        
        return View((locationMappings, locations));
    }

    /// <summary>
    /// Delete a location mapping
    /// </summary>
    /// <param name="id"></param>
    /// <returns></returns>
    [HttpGet]
    [Route("Delete/{id:int}")]
    [AuthorizeMiddleware(UserRoleEnum.Admin)]
    public async Task<IActionResult> Delete(int id)
    {
        await _locationMappingLogic.Delete(id);

        return RedirectToAction("Index");
    }
        
    /// <summary>
    /// Edit a location mapping
    /// </summary>
    /// <param name="id"></param>
    /// <returns></returns>
    [HttpGet]
    [Route("Edit/{id:int}")]
    public async Task<IActionResult> EditView(int id)
    {
        if (TempData.ContainsKey("Error"))
        {
            ViewData["Error"] = TempData["Error"];
            TempData.Clear();
        }
        
        var locationMapping = await _locationMappingLogic.Get(id);
        var locations = (await _locationLogic.GetAll()).ToList();

        return View("Edit", (locationMapping, locations));
    }
        
    /// <summary>
    /// Edit a location mapping
    /// </summary>
    /// <param name="locationMapping"></param>
    /// <returns></returns>
    [HttpPost]
    [Route("Edit")]
    public async Task<IActionResult> EditHandler(LocationMapping locationMapping)
    {
        try
        {
            await _locationMappingLogic.Update(locationMapping.Id, locationMapping);

            return RedirectToAction("Index");
        }
        catch (Exception e)
        {
            TempData["Error"] = $"Failed to edit location mapping. Please try again! {e.Message}";

            return RedirectToAction("EditView", new { id = locationMapping.Id });
        }
    }

    /// <summary>
    /// Edit a location mapping
    /// </summary>
    /// <returns></returns>
    [HttpGet]
    [Route("New")]
    public async Task<IActionResult> SaveView()
    {
        if (TempData.ContainsKey("Error"))
        {
            ViewData["Error"] = TempData["Error"];
            TempData.Clear();
        }
        
        var locations = (await _locationLogic.GetAll()).ToList();

        return View("Save", (new LocationMapping(), locations));
    }
        
    /// <summary>
    /// Save a location mapping
    /// </summary>
    /// <param name="locationMapping"></param>
    /// <returns></returns>
    [HttpPost]
    [Route("New")]
    public async Task<IActionResult> SaveHandler(LocationMapping locationMapping)
    {
        try
        {
            await _locationMappingLogic.Save(locationMapping);

            return RedirectToAction("Index");
        }
        catch (Exception e)
        {
            TempData["Error"] = $"Failed to save location mapping. Please try again! {e.Message}";

            return RedirectToAction("SaveView");
        }
    }
}