using System.Threading.Tasks;
using API.Attributes;
using DAL.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Models.Entities;
using Models.Enums;
using Swashbuckle.AspNetCore.Annotations;

namespace API.Controllers.API;

[AuthorizeMiddleware]
[Route("api/[controller]")]
public class ConfigController(IConfigLogic configLogic) : Controller
{
    [HttpGet]
    [Route("")]
    [SwaggerOperation("Status")]
    public async Task<IActionResult> Status()
    {
        return Ok(await configLogic.ResolveGlobalConfig());
    }

    [HttpPut]
    [Route("")]
    [AuthorizeMiddleware(UserRoleEnum.Admin)]
    public async Task<IActionResult> Update([FromBody] GlobalConfigs globalConfigs)
    {
        await configLogic.SetGlobalConfig(globalConfigs);
        return Ok(await configLogic.ResolveGlobalConfig());
    }
}