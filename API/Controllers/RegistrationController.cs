﻿using System.Threading.Tasks;
using API.Attributes;
using API.Extensions;
using Logic.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Models.Entities;

namespace API.Controllers
{
    [AllowAnonymous]
    [ApiExplorerSettings(IgnoreApi = true)]
    [Route("[controller]")]
    public class RegistrationController : Controller
    {
        private readonly IRegistrationLogic _registrationLogic;

        public RegistrationController(IRegistrationLogic registrationLogic)
        {
            _registrationLogic = registrationLogic;
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
        /// Returns registration pages
        /// </summary>
        /// <returns></returns>
        [HttpGet]
        [Route("Driver")]
        public IActionResult Driver()
        {
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
            if (await _registrationLogic.RegisterDriver(driver))
            {
                ModelState.ClearModelStateErrors();
                
                return View("Thankyou");   
            }

            // TODO: use a proper 500 error page
            return Ok("Failed!");
        }

        [HttpGet]
        [Route("Student")]
        public IActionResult Student()
        {
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
            if (await _registrationLogic.RegisterStudent(student))
            {
                ModelState.ClearModelStateErrors();

                return View("Thankyou");   
            }

            // TODO: use a proper 500 error page
            return Ok("Failed!");
        }
        
        [AuthorizeMiddleware]
        [HttpGet]
        [Route("Host")]
        public IActionResult Host()
        {
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
            if (await _registrationLogic.RegisterHost(host))
            {
                ModelState.ClearModelStateErrors();

                return View("Thankyou");   
            }

            // TODO: use a proper 500 error page
            return Ok("Failed!");
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
            if (await _registrationLogic.RegisterEvent(@event))
            {
                ModelState.ClearModelStateErrors();

                return RedirectToAction("Index", "Event");
            }

            // TODO: use a proper 500 error page
            return Ok("Failed!");
        }
    }
}