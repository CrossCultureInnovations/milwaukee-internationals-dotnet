using System;
using System.Linq;
using System.Threading.Tasks;
using Logic.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Models.Entities;
using Models.ViewModels.PasswordReset;

namespace API.Controllers;

[ApiExplorerSettings(IgnoreApi = true)]
[AllowAnonymous]
[Route("[controller]")]
public class PasswordResetController(
    UserManager<User> userManager,
    IUserLogic userLogic,
    IPasswordResetLogic passwordResetLogic)
    : Controller
{
    [HttpGet]
    [Route("")]
    public IActionResult PasswordResetRequest()
    {
        if (TempData.TryGetValue("Error", out var error))
        {
            ViewData["Error"] = error;
        }
            
        if (TempData.TryGetValue("Message", out var message))
        {
            ViewData["Message"] = message;
        }
            
        TempData.Clear();
            
        return View(new PasswordResetRequestViewModel());
    }
        
    [HttpPost]
    [Route("")]
    public async Task<IActionResult> PasswordResetRequestHandler(PasswordResetRequestViewModel requestViewModel)
    {
        var user = (await userLogic.GetAll()).FirstOrDefault(x =>
            string.Equals(x.Email, requestViewModel.Email, StringComparison.OrdinalIgnoreCase) &&
            string.Equals(x.UserName, requestViewModel.Username, StringComparison.OrdinalIgnoreCase));

        if (user == null)
        {
            TempData["Error"] = "Failed to find the user";

            return RedirectToAction("PasswordResetRequest");
        }

        var token = await userManager.GeneratePasswordResetTokenAsync(user);

        await passwordResetLogic.SendPasswordResetEmail(user, token);
            
        TempData["Message"] = "Successfully sent the password reset email. Please check your email!";

        return RedirectToAction("PasswordResetRequest");
    }
        
    [HttpGet]
    [Route("{userId:int}")]
    public async Task<IActionResult> PasswordReset([FromRoute] int userId, [FromQuery] string token)
    {
        if (TempData.TryGetValue("Error", out var error))
        {
            ViewData["Error"] = error;
        }
            
        if (TempData.TryGetValue("Message", out var message))
        {
            ViewData["Message"] = message;
        }
            
        TempData.Clear();

        var user = await userLogic.Get(userId);
            
        var isResetTokenValid = await userManager.VerifyUserTokenAsync(user, TokenOptions.DefaultProvider, "ResetPassword", token);
            
        if (!isResetTokenValid)
        {
            TempData["Error"] = "Password Reset link is not valid!";

            return RedirectToAction("PasswordResetRequest");
        }

        var viewModel = new PasswordResetViewModel
        {
            Email = user.Email,
            Username = user.UserName,
            Token = token,
            Id = user.Id
        };

        return View(viewModel);
    }
        
    [HttpPost]
    [Route("Reset")]
    public async Task<IActionResult> PasswordResetHandler(PasswordResetViewModel passwordResetViewModel)
    {
        if (passwordResetViewModel.Password != passwordResetViewModel.ConfirmPassword)
        {
            TempData["Error"] = "Password and Password Confirmation do not match!";

            return RedirectToAction("PasswordReset");
        }

        var user = await userManager.FindByIdAsync(passwordResetViewModel.Id.ToString());
            
        var isResetTokenValid = await userManager.ResetPasswordAsync(user, passwordResetViewModel.Token, passwordResetViewModel.Password);
            
        if (isResetTokenValid.Succeeded)
        {
            return RedirectToAction("Login", "Identity");
        }
            
        TempData["Error"] = "Password Reset failed";

        return RedirectToAction("PasswordResetRequest");
    }
}