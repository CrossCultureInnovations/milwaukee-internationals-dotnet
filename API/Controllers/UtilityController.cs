using System.Threading.Tasks;
using API.Attributes;
using Logic.Extensions;
using Logic.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Models.Enums;
using Models.ViewModels;

namespace API.Controllers;

[ApiExplorerSettings(IgnoreApi = true)]
[Route("[controller]")]
public class UtilityController : Controller
{
    private readonly IEmailUtilityLogic _emailUtilityLogic;
    private readonly ISmsUtilityLogic _smsUtilityLogic;
    private readonly IStudentLogic _studentLogic;
    private readonly IDriverLogic _driverLogic;

    public UtilityController(IEmailUtilityLogic emailUtilityLogic, ISmsUtilityLogic smsUtilityLogic, IStudentLogic studentLogic, IDriverLogic driverLogic)
    {
        _emailUtilityLogic = emailUtilityLogic;
        _smsUtilityLogic = smsUtilityLogic;
        _studentLogic = studentLogic;
        _driverLogic = driverLogic;
    }

    /// <summary>
    /// Returns email utility view
    /// </summary>
    /// <returns></returns>
    [AuthorizeMiddleware(UserRoleEnum.Admin)]
    [HttpGet]
    [Route("AdHocEmail")]
    public async Task<IActionResult> AdHocEmail(bool status = false)
    {
        var viewModel = await _emailUtilityLogic.GetEmailForm();

        viewModel.Status = status;
            
        return View(viewModel);
    }

    /// <summary>
    /// Post action handler
    /// </summary>
    /// <returns></returns>
    [AuthorizeMiddleware(UserRoleEnum.Admin)]
    [HttpPost]
    [Route("AdHocEmailAction")]
    public async Task<IActionResult> AdHocEmailAction([FromForm]EmailFormViewModel emailFormViewModel)
    {
        // Handle the action
        var result = await _emailUtilityLogic.HandleAdHocEmail(emailFormViewModel);

        return RedirectToAction("AdHocEmail", new { status = result });
    }
    
    /// <summary>
    /// Post action handler
    /// </summary>
    /// <returns></returns>
    [AuthorizeMiddleware(UserRoleEnum.Admin)]
    [HttpGet]
    [Route("SendConfirmationEmail/{rolesEnum}")]
    public async Task<IActionResult> SendConfirmationEmail(EntitiesEnum rolesEnum)
    {
        // Handle the action
        await _emailUtilityLogic.SendConfirmationEmail(rolesEnum);

        return RedirectToAction("AdHocEmail", new { status = true });
    }
        
    /// <summary>
    /// Post action handler
    /// </summary>
    /// <returns></returns>
    [HttpGet]
    [Route("EmailCheckIn/{type}/{hashcode}")]
    public async Task<IActionResult> EmailCheckIn([FromRoute] EntitiesEnum type, [FromRoute] string hashcode)
    {
        // ReSharper disable once SwitchStatementMissingSomeCases
        switch (type)
        {
            case EntitiesEnum.Student when await _studentLogic.GetByHashcode(hashcode) != null:
                return View(await _studentLogic.GetByHashcode(hashcode));
            case EntitiesEnum.Driver when await _driverLogic.GetByHashcode(hashcode) != null:
                return View(await _driverLogic.GetByHashcode(hashcode));
            default:
                return Redirect("~/");
        }
    }
        
    /// <summary>
    /// Post action handler
    /// </summary>
    /// <returns></returns>
    [HttpPost]
    [Route("EmailCheckInAction/{type}/{id:int}")]
    public async Task<IActionResult> EmailCheckInHandler([FromRoute] EntitiesEnum type, [FromRoute] int id,
        [FromQuery] bool present)
    {
        var result = await _emailUtilityLogic.HandleEmailCheckIn(type, id, present);

        // Redirect to home page
        return Ok(result);
    }
    
    
    /// <summary>
    /// Returns sms utility view
    /// </summary>
    /// <returns></returns>
    [AuthorizeMiddleware(UserRoleEnum.Admin)]
    [HttpGet]
    [Route("AdHocSms")]
    public async Task<IActionResult> AdHocSms(bool status = false)
    {
        var viewModel = await _smsUtilityLogic.GetSmsForm();

        viewModel.Status = status;
            
        return View(viewModel);
    }

    /// <summary>
    /// Post action handler
    /// </summary>
    /// <returns></returns>
    [AuthorizeMiddleware(UserRoleEnum.Admin)]
    [HttpPost]
    [Route("AdHocSmsAction")]
    public async Task<IActionResult> AdHocSmsAction(SmsFormViewModel smsFormViewModel)
    {
        // Handle the action
        var result = await _smsUtilityLogic.HandleAdHocSms(smsFormViewModel);

        return RedirectToAction("AdHocSms", new { status = true });
    }
}
