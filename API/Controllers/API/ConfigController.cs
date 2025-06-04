using System.Threading.Tasks;
using API.Attributes;
using DAL.Interfaces;
using Microsoft.AspNetCore.Mvc;
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
}