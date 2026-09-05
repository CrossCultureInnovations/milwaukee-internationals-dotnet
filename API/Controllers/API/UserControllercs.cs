using System.Linq;
using System.Threading.Tasks;
using API.Abstracts;
using API.Attributes;
using Logic.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Models.Entities;
using Models.Enums;
using Models.ViewModels.Identities;
using Swashbuckle.AspNetCore.Annotations;

namespace API.Controllers.API;

// Every action here exposes or mutates accounts, including the inherited CRUD
// verbs, so the whole controller is admin-only
[AuthorizeMiddleware(UserRoleEnum.Admin)]
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
    [Route("")]
    [SwaggerOperation("Save")]
    public override async Task<IActionResult> Save([FromBody] User user)
    {
        if (string.IsNullOrWhiteSpace(user.Password))
        {
            return BadRequest(new { error = "Password is required." });
        }

        try
        {
            var savedUser = await userLogic.Save(user);
            return Ok(savedUser);
        }
        catch (System.InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (System.ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
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

    [HttpPost]
    [Route("{id:int}/Password")]
    [AuthorizeMiddleware(UserRoleEnum.Admin)]
    public async Task<IActionResult> ChangePassword(
        [FromRoute] int id,
        [FromBody] ChangePasswordViewModel changePasswordViewModel)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        if (changePasswordViewModel.Password != changePasswordViewModel.ConfirmPassword)
        {
            return BadRequest(new { error = "Password and password confirmation do not match." });
        }

        var user = await userManager.FindByIdAsync(id.ToString());
        if (user == null)
        {
            return NotFound(new { error = "User not found." });
        }

        var token = await userManager.GeneratePasswordResetTokenAsync(user);
        var result = await userManager.ResetPasswordAsync(user, token, changePasswordViewModel.Password);
        if (!result.Succeeded)
        {
            return BadRequest(new { error = string.Join(" ", result.Errors.Select(error => error.Description)) });
        }

        return Ok(new { message = "Password changed successfully." });
    }
}
