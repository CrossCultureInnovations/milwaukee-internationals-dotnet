﻿using System.Threading.Tasks;
using API.Attributes;
using Logic.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Models.Entities;
using Models.Enums;

namespace API.Controllers
{
    [ApiExplorerSettings(IgnoreApi = true)]
    [AuthorizeMiddleware]
    [Route("[controller]")]
    public class DriverController : Controller
    {
        private readonly IDriverLogic _driverLogic;

        /// <summary>
        /// Constructor dependency injection
        /// </summary>
        /// <param name="driverLogic"></param>
        public DriverController(IDriverLogic driverLogic)
        {
            _driverLogic = driverLogic;
        }
        
        /// <summary>
        /// Returns driver view
        /// </summary>
        /// <returns></returns>
        [HttpGet]
        [Route("")]
        public async Task<IActionResult> Index()
        {
            return View(await _driverLogic.GetAll());
        }
        
        /// <summary>
        /// Delete a driver
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        [HttpGet]
        [Route("Delete/{id}")]
        [AuthorizeMiddleware(UserRoleEnum.Admin)]
        public async Task<IActionResult> Delete(int id)
        {
            await _driverLogic.Delete(id);

            return RedirectToAction("Index");
        }
        
        /// <summary>
        /// Edit a driver
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        [HttpGet]
        [Route("Edit/{id}")]
        public async Task<IActionResult> EditView(int id)
        {
            var driver = await _driverLogic.Get(id);

            return View("Edit", driver);
        }
        
        /// <summary>
        /// Edit a driver
        /// </summary>
        /// <param name="driver"></param>
        /// <returns></returns>
        [HttpPost]
        [Route("Edit")]
        public async Task<IActionResult> EditHandler(Driver driver)
        {
            await _driverLogic.Update(driver.Id, driver);

            return RedirectToAction("Index");
        }
    }
}