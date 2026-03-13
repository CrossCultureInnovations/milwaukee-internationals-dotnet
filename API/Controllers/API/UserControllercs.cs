using System.Threading.Tasks;
using API.Abstracts;
using API.Attributes;
using Logic.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Models.Entities;
using Models.Enums;

namespace API.Controllers.API;

[AuthorizeMiddleware]
[Route("api/[controller]")]
public class UserController(
    IUserLogic userLogic,
    UserManager<User> userManager,
    IPasswordResetLogic passwordResetLogic) : BasicCrudController<User>
{
    /// <summary>
    /// Returns instance of logic
    /// </summary>
    /// <returns></returns>
    protected override IBasicCrudLogic<User> BasicCrudLogic()
    {
        return userLogic;
    }

    [HttpPost]
    [Route("{id:int}/SendPasswordReset")]
    [AuthorizeMiddleware(UserRoleEnum.Admin)]
    public async Task<IActionResult> SendPasswordReset([FromRoute] int id)
    {
        var user = await userLogic.Get(id);
        var token = await userManager.GeneratePasswordResetTokenAsync(user);
        await passwordResetLogic.SendPasswordResetEmail(user, token);
        return Ok(new { message = "Password reset email sent successfully." });
    }
}
