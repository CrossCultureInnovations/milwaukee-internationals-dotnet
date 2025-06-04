using System.Threading.Tasks;
using API.Attributes;
using Logic.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Models.Enums;
using Models.ViewModels;
using Swashbuckle.AspNetCore.Annotations;

namespace API.Controllers.API;

[AuthorizeMiddleware]
[Route("api/[controller]")]
public class DriverHostMappingController(IDriverHostMappingLogic driverHostMappingLogic) : Controller
{
    [HttpGet]
    [Route("Status")]
    [SwaggerOperation("DriverHostMappingStatus")]
    public async Task<IActionResult> DriverHostMappingStatus()
    {
        return Ok(await driverHostMappingLogic.MappingStatus());
    }
        
    /// <summary>
    /// Maps the driver to host
    /// </summary>
    /// <returns></returns>
    [HttpPost]
    [Route("Map")]
    [SwaggerOperation("DriverHostMappingMap")]
    public async Task<IActionResult> DriverHostMappingMap([FromBody] NewDriverHostMappingViewModel newDriverHostMappingViewModel)
    {
        return Ok(await driverHostMappingLogic.MapDriverToHost(newDriverHostMappingViewModel));
    }
        
    /// <summary>
    /// Un-Maps driver from host
    /// </summary>
    /// <returns></returns>
    [HttpPost]
    [Route("UnMap")]
    [SwaggerOperation("DriverHostMappingUnMap")]
    public async Task<IActionResult> DriverHostMappingUnMap([FromBody] NewDriverHostMappingViewModel newDriverHostMappingViewModel)
    {
        return Ok(await driverHostMappingLogic.UnMapDriverToHost(newDriverHostMappingViewModel));
    }
        
    /// <summary>
    /// Email mappings to hosts
    /// </summary>
    /// <returns></returns>
    [HttpPost]
    [Route("EmailMappings")]
    [SwaggerOperation("EmailMappings")]
    [AuthorizeMiddleware(UserRoleEnum.Admin)]
    public async Task<IActionResult> EmailMappings()
    {
        return Ok(await driverHostMappingLogic.EmailMappings());
    }
}