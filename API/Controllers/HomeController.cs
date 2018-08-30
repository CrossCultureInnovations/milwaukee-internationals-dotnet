﻿using System.Threading.Tasks;
using API.Extensions;
using Logic.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace API.Controllers
{
    [ApiExplorerSettings(IgnoreApi = true)]
    public class HomeController : Controller
    {
        public async Task<IActionResult> Index()
        {
            return Redirect("~/Registration/Student".ToLower());
        }

        /// <summary>
        /// View page to register
        /// </summary>
        /// <returns></returns>
        [HttpGet]
        [Route("Register")]
        [SwaggerOperation("Register")]
        public async Task<IActionResult> Register()
        {
            return Redirect("~/Identity/Register".ToLower());
        }
        
        /// <summary>
        /// View page to register
        /// </summary>
        /// <returns></returns>
        [HttpGet]
        [Route("Echo")]
        [SwaggerOperation("Echo")]
        public async Task<IActionResult> Echo()
        {
            return Ok(HttpContext.Session.GetUserInfo());
        }
    }
}