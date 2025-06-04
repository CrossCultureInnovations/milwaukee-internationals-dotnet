using System;
using System.Linq;
using System.Threading.Tasks;
using API.Abstracts;
using API.Attributes;
using API.Utilities;
using DAL.Interfaces;
using Logic.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Models.Entities;
using Models.ViewModels.Identities;

namespace API.Controllers;

[ApiExplorerSettings(IgnoreApi = true)]
[Route("[controller]")]
public class IdentityController(
    IUserLogic userLogic,
    UserManager<User> userManager,
    SignInManager<User> signInManager,
    RoleManager<IdentityRole<int>> roleManager,
    IApiEventService apiEventService,
    JwtSettings jwtSettings,
    ILogger<IdentityController> logger)
    : AbstractIdentityController
{
    private readonly ILogger<IdentityController> _logger = logger;

    protected override UserManager<User> ResolveUserManager()
    {
        return userManager;
    }

    protected override SignInManager<User> ResolveSignInManager()
    {
        return signInManager;
    }

    protected override RoleManager<IdentityRole<int>> ResolveRoleManager()
    {
        return roleManager;
    }

    protected override JwtSettings ResolveJwtSettings()
    {
        return jwtSettings;
    }

    /// <summary>
    ///     View page to login
    /// </summary>
    /// <returns></returns>
    [HttpGet]
    [Route("Login")]
    [DisallowAuthenticated]
    public IActionResult Login()
    {
        if (TempData.ContainsKey("Error"))
        {
            var prevError = (string)TempData["Error"];

            ModelState.AddModelError("", prevError);

            TempData.Clear();
        }

        return View();
    }

    /// <summary>
    ///     Handles login the user
    /// </summary>
    /// <returns></returns>
    [HttpPost]
    [Route("LoginHandler")]
    [DisallowAuthenticated]
    public async Task<IActionResult> LoginHandler(LoginViewModel loginViewModel)
    {
        TempData.Clear();
            
        var (result, message) = await base.Login(loginViewModel);
            
        if (result)
        {
            await apiEventService.RecordEvent($"User [{loginViewModel.Username}] logged in successfully");

            var user = (await userLogic.GetAll()).First(x =>
                x.UserName.Equals(loginViewModel.Username, StringComparison.OrdinalIgnoreCase));

            user.LastLoggedInDate = DateTimeOffset.Now;

            await userLogic.Update(user.Id, user);

            return RedirectToAction("Index", "Home");
        }

        await apiEventService.RecordEvent($"User [{loginViewModel.Username}] failed to login because of {message}");
            
        TempData["Error"] = message;

        return RedirectToAction("NotAuthenticated");
    }

    /// <summary>
    ///     View page to register
    /// </summary>
    /// <returns></returns>
    [HttpGet]
    [Route("Register")]
    [DisallowAuthenticated]
    public IActionResult Register()
    {
        if (TempData.ContainsKey("Error"))
        {
            var prevError = (string)TempData["Error"];

            if (prevError != null) ModelState.AddModelError("", prevError);

            TempData.Clear();
        }

        return View();
    }

    /// <summary>
    ///     Register the user
    /// </summary>
    /// <returns></returns>
    [HttpPost]
    [Route("RegisterHandler")]
    [DisallowAuthenticated]
    public async Task<IActionResult> RegisterHandler(RegisterViewModel registerViewModel)
    {
        TempData.Clear();

        if (registerViewModel.Password != registerViewModel.ConfirmPassword)
        {
            TempData["Error"] = "Password and Password Confirmation do not match. Please try again!";

            return RedirectToAction("Register");
        }

        // Save the user
        var (result, errors) = await Register(registerViewModel);

        if (result)
        {
            await apiEventService.RecordEvent($"User [{registerViewModel.Username}] successfully register");

            return RedirectToAction("Login");
        }

        TempData["Error"] = $"Failed to register: {string.Join(',', errors)}";
            
        await apiEventService.RecordEvent($"User [{registerViewModel.Username}] failed to register");

        return RedirectToAction("Register");
    }

    /// <summary>
    ///     Not authenticated view
    /// </summary>
    /// <returns></returns>
    [HttpGet]
    [Route("NotAuthenticated")]
    public IActionResult NotAuthenticated()
    {
        if (TempData.ContainsKey("Error"))
        {
            var prevError = (string)TempData["Error"];

            if (prevError != null) ModelState.AddModelError("", prevError);

            TempData.Clear();
        }
            
        return View();
    }

    /// <summary>
    ///     Not authorized view
    /// </summary>
    /// <returns></returns>
    [HttpGet]
    [Route("Logout")]
    [Authorize]
    public async Task<IActionResult> LogoutHandler()
    {
        var result = await ResolveUserManager().FindByNameAsync(User.Identity!.Name);
            
        await Logout();
            
        await apiEventService.RecordEvent($"User [{result.UserName}] successfully logged-out");

        return RedirectToAction("Login");
    }
        
    [Authorize]
    [HttpGet]
    [Route("Token")]
    public async Task<IActionResult> Token()
    {
        var user = await userManager.FindByNameAsync(User.Identity!.Name);
                
        var token = ResolveToken(user);

        return Ok(new { token });
    }
}