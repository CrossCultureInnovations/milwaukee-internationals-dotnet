using System;
using System.Linq;
using System.Threading.Tasks;
using API.Abstracts;
using API.Attributes;
using API.Interfaces;
using API.Utilities;
using DAL.Interfaces;
using Logic.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Hosting;
using Models.Entities;
using Models.ViewModels.Identities;
using Swashbuckle.AspNetCore.Annotations;

namespace API.Controllers.API;

[Route("api/[controller]")]
public class JwtIdentityController(
    JwtSettings jwtSettings,
    UserManager<User> userManager,
    SignInManager<User> signManager,
    RoleManager<IdentityRole<int>> roleManager,
    IUserLogic userLogic,
    IApiEventService apiEventService,
    IConfigLogic configLogic,
    ICapService capService,
    IWebHostEnvironment environment)
    : AbstractIdentityController
{
    [AllowAnonymous]
    [HttpGet]
    [Route("captcha")]
    public async Task<IActionResult> Captcha()
    {
        var config = await configLogic.ResolveGlobalConfig();
        var captchaEnabled = CapService.IsEnabled(config, environment);
        var captchaEndpoint = captchaEnabled && CapService.TryBuildEndpoint(config, out var endpoint)
            ? endpoint.AbsoluteUri
            : null;
        return Ok(new { captchaEnabled, captchaEndpoint });
    }

    [AllowAnonymous]
    [HttpGet]
    [Route("")]
    [SwaggerOperation("AccountInfo")]
    public async Task<IActionResult> Index()
    {
        if (User.Identity is { IsAuthenticated: true })
        {
            var user = await userManager.FindByNameAsync(User.Identity.Name)
                       ?? await userManager.FindByEmailAsync(User.Identity.Name);

            if (user != null) return Ok(user);
        }

        return NoContent();
    }

    [NonAction]
    protected override UserManager<User> ResolveUserManager()
    {
        return userManager;
    }

    [NonAction]
    protected override SignInManager<User> ResolveSignInManager()
    {
        return signManager;
    }

    [NonAction]
    protected override RoleManager<IdentityRole<int>> ResolveRoleManager()
    {
        return roleManager;
    }

    [NonAction]
    protected override JwtSettings ResolveJwtSettings()
    {
        return jwtSettings;
    }

    [AllowAnonymous]
    [HttpPost]
    [Route("Register")]
    [SwaggerOperation("Register")]
    public new async Task<IActionResult> Register([FromBody] RegisterViewModel registerViewModel)
    {
        TempData.Clear();

        if (!await capService.IsSatisfied(registerViewModel.CaptchaToken))
        {
            return BadRequest(new { error = "Please complete the anti-spam verification." });
        }

        if (registerViewModel.Password != registerViewModel.ConfirmPassword)
        {
            TempData["Error"] = "Password and Password Confirmation do not match. Please try again!";

            return BadRequest("Password and Password Confirmation do not match");
        }

        // Save the user
        var (result, errors) = await base.Register(registerViewModel);

        if (result)
        {
            await apiEventService.RecordEvent($"User [{registerViewModel.Username}] successfully register");

            return Ok("Successfully registered");
        }
            
        await apiEventService.RecordEvent($"User [{registerViewModel.Username}] failed to register");

        return BadRequest("Failed to register");
    }

    [AllowAnonymous]
    [HttpPost]
    [Route("Login")]
    [SwaggerOperation("Login")]
    public new async Task<IActionResult> Login([FromBody] LoginViewModel loginViewModel)
    {
        TempData.Clear();

        if (!await capService.IsSatisfied(loginViewModel.CaptchaToken))
        {
            return BadRequest(new { error = "Please complete the anti-spam verification." });
        }
            
        var (result, message) = await base.Login(loginViewModel);
            
        if (result)
        {
            await apiEventService.RecordEvent($"User [{loginViewModel.Username}] logged in successfully");

            var user = (await userLogic.GetAll()).First(x =>
                x.UserName.Equals(loginViewModel.Username, StringComparison.OrdinalIgnoreCase));

            user.LastLoggedInDate = DateTimeOffset.Now;

            await userLogic.Update(user.Id, user);

            var token = await ResolveToken(user);

            return Ok(new
            {
                token,
                user.UserName,
                user.Email
            });
        }

        await apiEventService.RecordEvent($"User [{loginViewModel.Username}] failed to login because of {message}");

        return Unauthorized(new { error = message });
    }

    [AuthorizeMiddleware]
    [HttpPost]
    [Route("Logout")]
    [SwaggerOperation("Logout")]
    public new async Task<IActionResult> Logout()
    {
        var identityName = User.Identity!.Name;
        var result = await ResolveUserManager().FindByNameAsync(identityName)
                     ?? await ResolveUserManager().FindByEmailAsync(identityName);
            
        await base.Logout();
            
        await apiEventService.RecordEvent($"User [{result?.UserName ?? identityName}] successfully logged-out");

        return Ok("Successfully logged out");
    }
        
    [AuthorizeMiddleware]
    [HttpGet]
    [Route("Refresh")]
    [SwaggerOperation("Refresh")]
    public async Task<IActionResult> Refresh()
    {
        if (User.Identity?.Name is { } identityName)
        {
            var user = await userManager.FindByNameAsync(identityName)
                       ?? await userManager.FindByEmailAsync(identityName);

            if (user == null)
            {
                return Unauthorized();
            }
                
            var token = await base.ResolveToken(user);

            return Ok(new
            {
                token,
                user.UserName,
                user.Email
            });
        }

        return BadRequest("Failed to find the user");
    }
}