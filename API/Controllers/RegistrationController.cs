using System;
using System.Threading.Tasks;
using API.Attributes;
using API.Extensions;
using API.Interfaces;
using Logic.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Models.Entities;
using Models.Enums;

namespace API.Controllers;

[AllowAnonymous]
[ApiExplorerSettings(IgnoreApi = true)]
[Route("legacy/[controller]")]
public class RegistrationController(IRegistrationLogic registrationLogic, IAltchaService altchaService)
    : Controller
{
    /// <summary>
    /// Returns registration page for drivers
    /// </summary>
    /// <returns></returns>
    [HttpGet]
    [Route("")]
    public IActionResult Index()
    {
        return View();
    }
        
    /// <summary>
    /// Returns thank you page
    /// </summary>
    /// <returns></returns>
    [HttpGet]
    [Route("ThankYou")]
    public IActionResult ThankYou()
    {
        return View("Thankyou");
    }

    /// <summary>
    /// Returns registration pages
    /// </summary>
    /// <returns></returns>
    [HttpGet]
    [Route("Driver")]
    public async Task<IActionResult> Driver()
    {
        if (User.Identity is { IsAuthenticated: false } && !await registrationLogic.IsRegisterDriverOpen())
        {
            return View("DriverSorryClosed");
        }

        if (TempData.ContainsKey("Error"))
        {
            ViewData["Error"] = TempData["Error"];
            TempData.Clear();
        }
            
        return View(new Driver());
    }
        
    /// <summary>
    /// POST registration
    /// </summary>
    /// <returns></returns>
    [HttpPost]
    [Route("Driver/Register")]
    public async Task<IActionResult> RegisterDriver(Driver driver)
    {
        try
        {
            if (User.Identity is { IsAuthenticated: false } && !await altchaService.IsSatisfied(Request.Form["altcha"]))
            {
                throw new Exception("Captcha failed");
            }

            await registrationLogic.RegisterDriver(driver);

            ModelState.ClearModelStateErrors();

            return View("Thankyou", EntitiesEnum.Driver);
        }
        catch (Exception e)
        {
            TempData["Error"] = $"Failed to register driver. Please try again! {e.Message}";

            return RedirectToAction("Driver");
        }
    }

    [HttpGet]
    [Route("Student")]
    public async Task<IActionResult> Student()
    {
        if (User.Identity is { IsAuthenticated: false } && !await registrationLogic.IsRegisterStudentOpen())
        {
            return View("StudentSorryClosed");
        }

        if (TempData.ContainsKey("Error"))
        {
            ViewData["Error"] = TempData["Error"];
            TempData.Clear();
        }
            
        return View(new Student());
    }
        
    /// <summary>
    /// POST registration
    /// </summary>
    /// <returns></returns>
    [HttpPost]
    [Route("Student/Register")]
    public async Task<IActionResult> RegisterStudent(Student student)
    {
        try
        {
            if (User.Identity is { IsAuthenticated: false } && !await altchaService.IsSatisfied(Request.Form["altcha"]))
            {
                throw new Exception("Captcha failed");
            }

            var registeredStudent = await registrationLogic.RegisterStudent(student);

            ModelState.ClearModelStateErrors();

            ViewBag.DisplayId = registeredStudent?.DisplayId;

            return View("Thankyou", EntitiesEnum.Student);
        }
        catch (Exception e)
        {
            TempData["Error"] = $"Failed to register student. Please try again! {e.Message}";

            return RedirectToAction("Student");
        }
    }
        
    [AuthorizeMiddleware]
    [HttpGet]
    [Route("Host")]
    public IActionResult Host()
    {
        if (TempData.ContainsKey("Error"))
        {
            ViewData["Error"] = TempData["Error"];
            TempData.Clear();
        }
            
        return View(new Host());
    }
        
    /// <summary>
    /// POST registration
    /// </summary>
    /// <returns></returns>
    [AuthorizeMiddleware]
    [HttpPost]
    [Route("Host/Register")]
    public async Task<IActionResult> RegisterHost(Host host)
    {
        try
        {
            await registrationLogic.RegisterHost(host);

            ModelState.ClearModelStateErrors();

            return View("Thankyou", EntitiesEnum.Host);
        }
        catch (Exception e)
        {
            TempData["Error"] = $"Failed to register host. Please try again! {e.Message}";

            return RedirectToAction("Host");
        }
    }
        
    [AuthorizeMiddleware]
    [HttpGet]
    [Route("Event")]
    public IActionResult Event()
    {
        return View(new Event());
    }

    /// <summary>
    /// POST registration
    /// </summary>
    /// <returns></returns>
    [AuthorizeMiddleware]
    [HttpPost]
    [Route("Event/Register")]
    public async Task<IActionResult> RegisterEvent(Event @event)
    {
        try
        {
            await registrationLogic.RegisterEvent(@event);

            ModelState.ClearModelStateErrors();

            return RedirectToAction("Index", "Event");
        }
        catch (Exception e)
        {
            TempData["Error"] = $"Failed to register event. Please try again! {e.Message}";

            return RedirectToAction("Event");
        }
    }      
    
    [AuthorizeMiddleware]
    [HttpGet]
    [Route("Location")]
    public IActionResult Location()
    {
        return View(new Location());
    }

    /// <summary>
    /// POST registration
    /// </summary>
    /// <returns></returns>
    [AuthorizeMiddleware]
    [HttpPost]
    [Route("Location/Register")]
    public async Task<IActionResult> RegisterLocation(Location location)
    {
        try
        {
            await registrationLogic.RegisterLocation(location);

            ModelState.ClearModelStateErrors();

            return RedirectToAction("Index", "Location");
        }
        catch (Exception e)
        {
            TempData["Error"] = $"Failed to register location. Please try again! {e.Message}";

            return RedirectToAction("Location");
        }
    }
}