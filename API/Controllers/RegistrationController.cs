using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;
using API.Attributes;
using API.Extensions;
using Logic.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Models.Entities;
using Models.Enums;
using Models.ViewModels;

namespace API.Controllers;

[AllowAnonymous]
[ApiExplorerSettings(IgnoreApi = true)]
[Route("[controller]")]
public class RegistrationController : Controller
{
    private readonly IRegistrationLogic _registrationLogic;
    private readonly IConfiguration _configuration;

    public RegistrationController(IRegistrationLogic registrationLogic, IConfiguration configuration)
    {
        _registrationLogic = registrationLogic;
        _configuration = configuration;
    }
        
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
        if (User.Identity is { IsAuthenticated: false } && !await _registrationLogic.IsRegisterDriverOpen())
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
            await _registrationLogic.RegisterDriver(driver);

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
        if (User.Identity is { IsAuthenticated: false } && !await _registrationLogic.IsRegisterStudentOpen())
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
            // obtain the response token from user input
            // also called "response parameter" or "verification token"
            string hCaptchaToken = Request.Form["h-captcha-response"];

            // collect data for post request
            var dicData = new Dictionary<string, string>
            {
                ["secret"] = _configuration.GetValue<string>("HCPATHCA_SECRET"),
                ["response"] = hCaptchaToken
            };

            // convert dictionary into form data
            var formData = new FormUrlEncodedContent(dicData);

            const string url = "https://hcaptcha.com/siteverify";

            var hc = new HttpClient();

            // perform post request
            var res = await hc.PostAsync(url, formData);

            var hCaptchaResult = await res.Content.ReadFromJsonAsync<HCaptchaResult>();

            if (!hCaptchaResult.Success)
            {
                throw new Exception("Captcha failed");
            }
            
            await _registrationLogic.RegisterStudent(student);

            ModelState.ClearModelStateErrors();

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
            await _registrationLogic.RegisterHost(host);

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
            await _registrationLogic.RegisterEvent(@event);

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
            await _registrationLogic.RegisterLocation(location);

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