using API.Abstracts;
using API.Attributes;
using Logic.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Models.Entities;

namespace API.Controllers.API;

[AuthorizeMiddleware]
[Route("api/[controller]")]
public class HostController(IHostLogic hostLogic) : BasicCrudController<Host>
{
    protected override IBasicCrudLogic<Host> BasicCrudLogic()
    {
        return hostLogic;
    }
}