using System;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using API.Utilities;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using Models.Entities;
using Models.Enums;
using Models.ViewModels.Identities;

namespace API.Abstracts;

public abstract class AbstractIdentityController : Controller
{
    [NonAction]
    protected abstract UserManager<User> ResolveUserManager();

    [NonAction]
    protected abstract SignInManager<User> ResolveSignInManager();

    [NonAction]
    protected abstract RoleManager<IdentityRole<int>> ResolveRoleManager();
        
    [NonAction]
    protected abstract JwtSettings ResolveJwtSettings();

    [NonAction]
    protected async Task<(bool, string[])> Register(RegisterViewModel registerViewModel)
    {
        var role = ResolveUserManager().Users.Any() ? UserRoleEnum.Basic : UserRoleEnum.Admin;
        var enable = !ResolveUserManager().Users.Any();
            
        var user = new User
        {
            Fullname = registerViewModel.Fullname,
            UserName = registerViewModel.Username,
            Email = registerViewModel.Email,
            PhoneNumber = registerViewModel.PhoneNumber,
            SecurityStamp = Guid.NewGuid().ToString(),
            UserRoleEnum = role,
            Enable = enable
        };

        var re = await ResolveUserManager().CreateAsync(user, registerViewModel.Password);
        var result1 = re.Succeeded;

        if (!result1)
        {
            return (false, re.Errors.Select(x => x.Description).ToArray());
        }

        var result2 = true;
            
        foreach (var subRole in role.SubRoles())
        {
            if (!await ResolveRoleManager().RoleExistsAsync(subRole.ToString()))
            {
                await ResolveRoleManager().CreateAsync(new IdentityRole<int>(subRole.ToString()));
            }
                
            // Add role to the user always
            result2 &= (await ResolveUserManager().AddToRoleAsync(user, subRole.ToString())).Succeeded;
        }

        return (result2, Array.Empty<string>());
    }

    [NonAction]
    protected async Task<(bool, string)> Login(LoginViewModel loginViewModel)
    {
        // Ensure the username and password is valid.
        var result = await ResolveUserManager().FindByNameAsync(loginViewModel.Username);
            
        if (result == null)
        {
            return (false, "Could not find account associated with this username.");
        }

        var loginResult = await ResolveSignInManager().PasswordSignInAsync(result, loginViewModel.Password, true, true);

        if (loginResult.IsLockedOut)
        {
            return (false, "Your account is locked out.");
        }

        if (!loginResult.Succeeded)
        {
            return (false, "Username/Password combination is not valid.");
        }

        // Generate and issue a JWT token
        var claims = new[]
        {
            new Claim(ClaimTypes.Name, result.Email)
        };

        var identity = new ClaimsIdentity(
            claims, CookieAuthenticationDefaults.AuthenticationScheme,
            ClaimTypes.Name, ClaimTypes.Role);

        var principal = new ClaimsPrincipal(identity);

        var authProperties = new AuthenticationProperties
        {
            AllowRefresh = true,
            ExpiresUtc = DateTimeOffset.Now.AddDays(1),
            IsPersistent = true
        };

        await HttpContext.SignInAsync(
            CookieAuthenticationDefaults.AuthenticationScheme,
            new ClaimsPrincipal(principal), authProperties);

        return (true, null);
    }

    [NonAction]
    protected async Task Logout()
    {
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            
        await ResolveSignInManager().SignOutAsync();
    }

    [NonAction]
    protected string ResolveToken(User user)
    {
        var jwtSettings = ResolveJwtSettings();
            
        // Generate and issue a JWT token
        var claims = new[]
        {
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Name, user.UserName),    // use username as name
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Sub, user.Email),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.Key));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            
        var expires = DateTime.Now.AddMinutes(jwtSettings.AccessTokenDurationInMinutes);

        var token = new JwtSecurityToken(
            jwtSettings.Issuer,
            jwtSettings.Issuer,
            claims,
            expires: expires,
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}