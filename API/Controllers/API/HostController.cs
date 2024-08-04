using API.Abstracts;
using API.Attributes;
using Logic.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Models.Entities;

namespace API.Controllers.API;

[AuthorizeMiddleware]
[Route("api/[controller]")]
public class HostController : BasicCrudController<Host>
{
    private readonly IHostLogic _hostLogic;

    public HostController(IHostLogic hostLogic)
    {
        _hostLogic = hostLogic;
    }

    protected override IBasicCrudLogic<Host> BasicCrudLogic()
    {
        return _hostLogic;
    }
}