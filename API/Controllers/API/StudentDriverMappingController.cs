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
public class StudentDriverMappingController(IStudentDriverMappingLogic studentDriverMappingLogic) : Controller
{
    /// <summary>
    /// Returns the status of mappings
    /// </summary>
    /// <returns></returns>
    [HttpGet]
    [Route("Status")]
    [SwaggerOperation("StudentDriverMappingStatus")]
    public async Task<IActionResult> StudentDriverMappingStatus()
    {
        return Ok(await studentDriverMappingLogic.MappingStatus());
    }
        
    /// <summary>
    /// Maps the student to driver
    /// </summary>
    /// <returns></returns>
    [HttpPost]
    [Route("Map")]
    [SwaggerOperation("StudentDriverMappingMap")]
    public async Task<IActionResult> StudentDriverMappingMap([FromBody] NewStudentDriverMappingViewModel newStudentDriverMappingViewModel)
    {
        return Ok(await studentDriverMappingLogic.MapStudentToDriver(newStudentDriverMappingViewModel));
    }
        
    /// <summary>
    /// Un-Maps student from driver
    /// </summary>
    /// <returns></returns>
    [HttpPost]
    [Route("UnMap")]
    [SwaggerOperation("StudentDriverMappingUnMap")]
    public async Task<IActionResult> StudentDriverMappingUnMap([FromBody] NewStudentDriverMappingViewModel newStudentDriverMappingViewModel)
    {
        return Ok(await studentDriverMappingLogic.UnMapStudentToDriver(newStudentDriverMappingViewModel));
    }
        
    /// <summary>
    /// Email mappings to drivers
    /// </summary>
    /// <returns></returns>
    [HttpPost]
    [Route("EmailMappings")]
    [SwaggerOperation("EmailMappings")]
    [AuthorizeMiddleware(UserRoleEnum.Admin)]
    public async Task<IActionResult> EmailMappings()
    {
        return Ok(await studentDriverMappingLogic.EmailMappings());
    }
}