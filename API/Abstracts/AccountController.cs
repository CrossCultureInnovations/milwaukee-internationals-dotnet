using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Models.Entities;
using Models.ViewModels.Identities;

namespace API.Abstracts
{
    public abstract class AbstractAccountController : Controller
    {
        public abstract UserManager<User> ResolveUserManager();

        public abstract SignInManager<User> ResolveSignInManager();

        public async Task<IdentityResult> Register(RegisterViewModel registerViewModel)
        {
            var user = new User
            {
                Fullname = registerViewModel.Fullname,
                UserName = registerViewModel.Username,
                Email = registerViewModel.Email
            };

            var rslt = await ResolveUserManager().CreateAsync(user, registerViewModel.Password);

            return rslt;
        }

        public async Task<bool> Login(LoginViewModel loginViewModel)
        {
            // Ensure the username and password is valid.
            var rslt = await ResolveUserManager().FindByNameAsync(loginViewModel.Username);

            if (rslt == null || !await ResolveUserManager().CheckPasswordAsync(rslt, loginViewModel.Password))
            {
                return false;
            }

            await ResolveSignInManager().SignInAsync(rslt, true);

            // Generate and issue a JWT token
            var claims = new[]
            {
                new Claim(ClaimTypes.Name, rslt.Email),
                new Claim(JwtRegisteredClaimNames.Sub, rslt.Email),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
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

            return true;
        }

        public async Task Logout()
        {
            await ResolveSignInManager().SignOutAsync();

            await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        }
    }
}