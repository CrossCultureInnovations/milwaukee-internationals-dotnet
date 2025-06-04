using System.Collections.Generic;
using System.Threading.Tasks;
using API.Abstracts;
using API.Attributes;
using Logic.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Models.Entities;
using Swashbuckle.AspNetCore.Annotations;

namespace API.Controllers.API;

[AuthorizeMiddleware]
[Route("api/[controller]")]
public class LocationController(ILocationLogic locationLogic) : BasicCrudController<Location>
{
    protected override IBasicCrudLogic<Location> BasicCrudLogic()
    {
        return locationLogic;
    }
    
    [AllowAnonymous]
    [HttpGet]
    [Route("")]
    [SwaggerOperation("GetAll")]
    [ProducesResponseType(typeof(IEnumerable<Location>), 200)]
    public override async Task<IActionResult> GetAll()
    {
        return Ok(await BasicCrudLogic().GetAll());
    }
}