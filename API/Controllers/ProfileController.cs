using System.Threading.Tasks;
using API.Attributes;
using Logic.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Models.Entities;
using Models.ViewModels;

namespace API.Controllers;

[ApiExplorerSettings(IgnoreApi = true)]
[AuthorizeMiddleware]
[Route("[controller]")]
public class ProfileController(UserManager<User> userManager, IProfileLogic profileLogic) : Controller
{
    [HttpGet]
    [Route("")]
    public async Task<IActionResult> Index()
    {
        if (User.Identity is { IsAuthenticated: true })
        {
            return View(profileLogic.ResolveProfile(await userManager.FindByNameAsync(User.Identity.Name)));
        }

        return new RedirectResult("~/");
    }
        
    [HttpPost]
    [Route("")]
    public async Task<IActionResult> Update(ProfileViewModel profileViewModel)
    {
        await profileLogic.UpdateUser(profileViewModel);

        return new RedirectResult("~/");
    }
}