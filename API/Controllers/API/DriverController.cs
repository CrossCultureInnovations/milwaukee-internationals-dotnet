using System.Threading.Tasks;
using API.Abstracts;
using API.Attributes;
using Logic.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Models.Entities;
using Models.ViewModels;
using Swashbuckle.AspNetCore.Annotations;

namespace API.Controllers.API;

[AuthorizeMiddleware]
[Route("api/[controller]")]
public class DriverController(IDriverLogic driverLogic) : BasicCrudController<Driver>
{
    [AllowAnonymous]
    [HttpPost]
    [Route("login")]
    [SwaggerOperation("DriverLogin")]
    public async Task<IActionResult> DriverLogin([FromBody] DriverLoginViewModel driverLoginViewModel)
    {
        var driver = await driverLogic.DriverLogin(driverLoginViewModel);

        if (driver == null)
        {
            return BadRequest("Failed to find the driver");
        }

        return Ok(driver);
    }

    protected override IBasicCrudLogic<Driver> BasicCrudLogic()
    {
        return driverLogic;
    }
}