using System.Threading.Tasks;
using API.Attributes;
using Logic.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Models.Entities;
using Models.Enums;

namespace API.Controllers;

[ApiExplorerSettings(IgnoreApi = true)]
[AuthorizeMiddleware]
[Route("[controller]")]
public class StudentController(IStudentLogic studentLogic) : Controller
{
    [HttpGet]
    [Route("")]
    public async Task<IActionResult> Index([FromQuery]string sortBy = null, [FromQuery]bool? descending = null)
    {
        return View(await studentLogic.GetAll(sortBy, descending));
    }
        
    /// <summary>
    /// Delete a driver
    /// </summary>
    /// <param name="id"></param>
    /// <returns></returns>
    [HttpGet]
    [Route("Delete/{id:int}")]
    [AuthorizeMiddleware(UserRoleEnum.Admin)]
    public async Task<IActionResult> Delete(int id)
    {
        await studentLogic.Delete(id);

        return RedirectToAction("Index");
    }
        
    /// <summary>
    /// Edit a student
    /// </summary>
    /// <param name="id"></param>
    /// <returns></returns>
    [HttpGet]
    [Route("Edit/{id:int}")]
    public async Task<IActionResult> EditView(int id)
    {
        var student = await studentLogic.Get(id);

        return View("Edit", student);
    }
        
    /// <summary>
    /// Edit a student
    /// </summary>
    /// <param name="student"></param>
    /// <returns></returns>
    [HttpPost]
    [Route("Edit")]
    public async Task<IActionResult> EditHandler(Student student)
    {
        await studentLogic.Update(student.Id, student);

        return RedirectToAction("Index");
    }
}