using System.Collections.Generic;
using System.Threading.Tasks;
using DAL.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Models.ViewModels;

namespace API.Controllers.API;

[AllowAnonymous]
[Route("api/[controller]")]
public class PushNotificationController(IApiEventService apiEventService) : Controller
{
    private static readonly HashSet<string> Tokens = [];

    [HttpGet]
    [Route("token")]
    public IActionResult GetAll()
    {
        return Ok(Tokens);
    }

    [HttpPost]
    [Route("token")]
    public async Task<IActionResult> Save([FromBody]TokenViewModel token)
    {
        await apiEventService.RecordEvent($"Received a token: {token.Token}");

        Tokens.Add(token.Token);
        
        return Ok(token);
    }
    
    [HttpDelete]
    [Route("token")]
    public async Task<IActionResult> Delete([FromBody]TokenViewModel token)
    {
        await apiEventService.RecordEvent($"Deleted a token: {token.Token}");

        Tokens.Remove(token.Token);

        return Ok(token);
    }
}