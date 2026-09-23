using System.Collections.Concurrent;
using System.Threading.Tasks;
using API.Attributes;
using DAL.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Models.Enums;
using Models.ViewModels;

namespace API.Controllers.API;

[AuthorizeMiddleware]
[Route("api/[controller]")]
public class PushNotificationController(IApiEventService apiEventService) : Controller
{
    private static readonly ConcurrentDictionary<string, byte> Tokens = new();

    [HttpGet]
    [Route("token")]
    [AuthorizeMiddleware(UserRoleEnum.Admin)]
    public IActionResult GetAll()
    {
        return Ok(Tokens.Keys);
    }

    [HttpPost]
    [Route("token")]
    public async Task<IActionResult> Save([FromBody]TokenViewModel token)
    {
        if (string.IsNullOrWhiteSpace(token.Token))
        {
            return BadRequest("A push notification token is required.");
        }

        await apiEventService.RecordEvent($"Received a token: {token.Token}");

        Tokens.TryAdd(token.Token, 0);
        
        return Ok(token);
    }
    
    [HttpDelete]
    [Route("token")]
    public async Task<IActionResult> Delete([FromBody]TokenViewModel token)
    {
        if (string.IsNullOrWhiteSpace(token.Token))
        {
            return BadRequest("A push notification token is required.");
        }

        await apiEventService.RecordEvent($"Deleted a token: {token.Token}");

        Tokens.TryRemove(token.Token, out _);

        return Ok(token);
    }
}