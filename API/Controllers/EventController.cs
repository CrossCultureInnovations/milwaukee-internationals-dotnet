﻿using System.Threading.Tasks;
using API.Attributes;
using Logic.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Models.Entities;
using Models.Enums;

namespace API.Controllers;

[ApiExplorerSettings(IgnoreApi = true)]
[AuthorizeMiddleware]
[Route("[controller]")]
public class EventController(IEventLogic eventLogic) : Controller
{
    /// <summary>
    /// Returns driver view
    /// </summary>
    /// <returns></returns>
    [HttpGet]
    [Route("")]
    public async Task<IActionResult> Index()
    {
        var events = await eventLogic.GetAll();
            
        return View(events);
    }
        
    /// <summary>
    /// Returns driver view
    /// </summary>
    /// <returns></returns>
    [AuthorizeMiddleware(UserRoleEnum.Admin)]
    [HttpGet]
    [Route("Delete/{id:int}")]
    public async Task<IActionResult> Delete([FromRoute] int id)
    {
        await eventLogic.Delete(id);

        return RedirectToAction("Index");
    }
        
    /// <summary>
    /// Returns edit event view
    /// </summary>
    /// <returns></returns>
    [AuthorizeMiddleware(UserRoleEnum.Admin)]
    [HttpGet]
    [Route("Edit/{id:int}")]
    public async Task<IActionResult> Edit([FromRoute] int id)
    {
        var @event = await eventLogic.Get(id);

        return View(@event);
    }
        
    /// <summary>
    /// Returns edit event view
    /// </summary>
    /// <returns></returns>
    [AuthorizeMiddleware(UserRoleEnum.Admin)]
    [HttpPost]
    [Route("Edit/{id:int}")]
    public async Task<IActionResult> EditHandler([FromRoute]int id, [FromBody]Event @event)
    {
        await eventLogic.Update(id, @event);

        return RedirectToAction("Index");
    }
        
    /// <summary>
    /// Returns event info
    /// </summary>
    /// <returns></returns>
    [AuthorizeMiddleware(UserRoleEnum.Admin)]
    [HttpGet]
    [Route("Info/{id:int}")]
    public IActionResult Info([FromRoute] int id)
    {
        return View(id);
    }
}