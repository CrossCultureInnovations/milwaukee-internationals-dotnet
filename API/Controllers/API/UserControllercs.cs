using API.Abstracts;
using API.Attributes;
using Logic.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Models.Entities;

namespace API.Controllers.API;

[AuthorizeMiddleware]
[Route("api/[controller]")]
public class UserController(IUserLogic userLogic) : BasicCrudController<User>
{
    /// <summary>
    /// Returns instance of logic
    /// </summary>
    /// <returns></returns>
    protected override IBasicCrudLogic<User> BasicCrudLogic()
    {
        return userLogic;
    }
}