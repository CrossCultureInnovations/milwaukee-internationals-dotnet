using System;
using System.Threading.Tasks;
using API.Attributes;
using Logic.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Models.Entities;
using Models.Enums;
using Models.ViewModels.Identities;

namespace API.Controllers;

[ApiExplorerSettings(IgnoreApi = true)]
[AuthorizeMiddleware(UserRoleEnum.Admin)]
[Route("[controller]")]
public class UserController : Controller
{
    private readonly IUserLogic _userLogic;
    private readonly UserManager<User> _userManager;

    public UserController(IUserLogic userLogic, UserManager<User> userManager)
    {
        _userLogic = userLogic;
        _userManager = userManager;
    }

    /// <summary>
    /// Returns user view
    /// </summary>
    /// <returns></returns>
    [HttpGet]
    [Route("")]
    public async Task<IActionResult> Index([FromQuery]string sortBy = null, [FromQuery]bool? descending = null)
    {
        return View(await _userLogic.GetAll(sortBy, descending));
    }

    /// <summary>
    /// Delete a user
    /// </summary>
    /// <param name="id"></param>
    /// <returns></returns>
    [HttpGet]
    [Route("Delete/{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await _userLogic.Delete(id);

        return RedirectToAction("Index");
    }
        
    /// <summary>
    /// Disable a user
    /// </summary>
    /// <param name="id"></param>
    /// <returns></returns>
    [HttpGet]
    [Route("Disable/{id:int}")]
    public async Task<IActionResult> Disable(int id)
    {
        await _userLogic.Disable(id);

        return RedirectToAction("Index");
    }
        
    /// <summary>
    /// Enable a user
    /// </summary>
    /// <param name="id"></param>
    /// <returns></returns>
    [HttpGet]
    [Route("Enable/{id:int}")]
    public async Task<IActionResult> Enable(int id)
    {
        await _userLogic.Enable(id);

        return RedirectToAction("Index");
    }
    
    [HttpGet]
    [Route("Edit/{id:int}")]
    [AuthorizeMiddleware(UserRoleEnum.Admin)]
    public async Task<IActionResult> Edit(int id)
    {
        var user = await _userLogic.Get(id);
        
        return View("Edit", new EditUserViewModel
        {
            Email = user.Email,
            Fullname = user.Fullname,
            PhoneNumber = user.PhoneNumber
        });
    }
    
    [HttpPost]
    [Route("Edit/{id:int}")]
    [AuthorizeMiddleware(UserRoleEnum.Admin)]
    public async Task<IActionResult> EditHandler([FromRoute]int id, [FromBody] EditUserViewModel editUserViewModel)
    {
        await _userLogic.Update(id, user =>
        {
            user.Fullname = editUserViewModel.Fullname;
            user.PhoneNumber = editUserViewModel.PhoneNumber;
            user.Email = editUserViewModel.Email;
        });
        
        return RedirectToAction("Index");
    }

    [HttpGet]
    [Route("PasswordReset/{id:int}")]
    [AuthorizeMiddleware(UserRoleEnum.Admin)]
    public async Task<IActionResult> PasswordReset(int id)
    {
        var user = await _userLogic.Get(id);
        
        return View("PasswordReset", new ChangePasswordViewModel
        {
            Fullname = user.Fullname,
            Password = string.Empty,
            ConfirmPassword = string.Empty,
        });
    }
    
    [HttpPost]
    [Route("PasswordReset/{id:int}")]
    [AuthorizeMiddleware(UserRoleEnum.Admin)]
    public async Task<IActionResult> PasswordResetHandler([FromRoute]int id, [FromBody]ChangePasswordViewModel changePasswordViewModel)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());

        await _userManager.RemovePasswordAsync(user);
        
        await _userManager.AddPasswordAsync(
            user, 
            changePasswordViewModel.Password);

        return RedirectToAction("Index");
    }
         
    /// <summary>
    /// Update User Role
    /// </summary>
    /// <returns></returns>
    [HttpGet]
    [Route("UpdateUserRole/{id:int}/{userRoleEnum}")]
    public async Task<IActionResult> UpdateUserRole(int id, UserRoleEnum userRoleEnum)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());

        switch (userRoleEnum)
        {
            case UserRoleEnum.Basic:
                await _userManager.AddToRoleAsync(user, UserRoleEnum.Basic.ToString());
                await _userManager.RemoveFromRoleAsync(user, UserRoleEnum.Admin.ToString());
                break;
            case UserRoleEnum.Admin:
                await _userManager.AddToRoleAsync(user, UserRoleEnum.Admin.ToString());
                await _userManager.AddToRoleAsync(user, UserRoleEnum.Basic.ToString());
                break;
            default:
                throw new ArgumentOutOfRangeException(nameof(userRoleEnum), userRoleEnum, null);
        }
            
        await _userLogic.Update(id, x => x.UserRoleEnum = userRoleEnum);
            
        return RedirectToAction("Index");
    }
}