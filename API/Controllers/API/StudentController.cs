using API.Abstracts;
using API.Attributes;
using Logic.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Models.Entities;

namespace API.Controllers.API;

[AuthorizeMiddleware]
[Route("api/[controller]")]
public class StudentController(IStudentLogic studentLogic) : BasicCrudController<Student>
{
    protected override IBasicCrudLogic<Student> BasicCrudLogic()
    {
        return studentLogic;
    }
}