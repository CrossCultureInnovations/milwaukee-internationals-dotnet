using System.Threading.Tasks;
using API.Abstracts;
using API.Attributes;
using Logic.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Models.Entities;
using Models.Enums;
using Models.ViewModels;
using Swashbuckle.AspNetCore.Annotations;

namespace API.Controllers.API;

[AuthorizeMiddleware(UserRoleEnum.Admin)]
[Route("api/[controller]")]
public class EventController(IEventLogic eventLogic, IEmailUtilityLogic emailUtilityLogic)
    : BasicCrudController<Event>
{
    /// <summary>
    /// Returns instance of logic
    /// </summary>
    /// <returns></returns>
    protected override IBasicCrudLogic<Event> BasicCrudLogic()
    {
        return eventLogic;
    }

    /// <summary>
    /// Map Student to event
    /// </summary>
    /// <returns></returns>
    [HttpPost]
    [Route("map/{eventId}/{studentId}")]
    [SwaggerOperation("MapStudentToEvent")]
    public async Task<IActionResult> MapStudent([FromRoute] int eventId, [FromRoute] int studentId)
    {
        var result = await eventLogic.MapStudent(eventId, studentId);

        return Ok(result);
    }
        
    /// <summary>
    /// UnMap Student to event
    /// </summary>
    /// <returns></returns>
    [HttpPost]
    [Route("unmap/{eventId}/{studentId}")]
    [SwaggerOperation("MapStudentToEvent")]
    public async Task<IActionResult> UnMapStudent([FromRoute] int eventId, [FromRoute] int studentId)
    {
        var result = await eventLogic.UnMapStudent(eventId, studentId);

        return Ok(result);
    }
        
        
    /// <summary>
    /// Registers an event
    /// </summary>
    /// <returns></returns>
    [HttpGet]
    [Route("Info/{id:int}")]
    public async Task<IActionResult> Info([FromRoute] int id)
    {
        var eventInfo = await eventLogic.GetEventInfo(id);

        return Ok(eventInfo);
    }
        
    /// <summary>
    /// Event email
    /// </summary>
    /// <returns></returns>
    [HttpGet]
    [Route("Email")]
    public async Task<IActionResult> EventEmail(EmailEventViewModel emailEventViewModel)
    {
        var result = await emailUtilityLogic.HandleEventEmail(emailEventViewModel);

        return Ok(result);
    }
}