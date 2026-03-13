using System;
using System.Threading.Tasks;
using API.Attributes;
using DAL.Interfaces;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Models.Entities;
using Models.Enums;
using Swashbuckle.AspNetCore.Annotations;

namespace API.Controllers.API;

[AuthorizeMiddleware]
[Route("api/[controller]")]
public class ConfigController(IConfigLogic configLogic, IConfiguration configuration, IWebHostEnvironment env) : Controller
{
    [HttpGet]
    [Route("")]
    [SwaggerOperation("Status")]
    public async Task<IActionResult> Status()
    {
        return Ok(await configLogic.ResolveGlobalConfig());
    }

    [HttpPut]
    [Route("")]
    [AuthorizeMiddleware(UserRoleEnum.Admin)]
    public async Task<IActionResult> Update([FromBody] GlobalConfigs globalConfigs)
    {
        await configLogic.SetGlobalConfig(globalConfigs);
        return Ok(await configLogic.ResolveGlobalConfig());
    }

    [HttpGet]
    [Route("connection-string")]
    [AuthorizeMiddleware(UserRoleEnum.Admin)]
    public IActionResult GetConnectionString()
    {
        string connectionString;
        string provider;

        if (env.IsDevelopment())
        {
            connectionString = configuration.GetValue<string>("ConnectionStrings:Sqlite") ?? "N/A";
            provider = "SQLite";
        }
        else
        {
            var databaseUrl = configuration.GetValue<string>("DATABASE_URL");
            connectionString = string.IsNullOrEmpty(databaseUrl) ? "N/A" : databaseUrl;
            provider = "PostgreSQL";
        }

        return Ok(new { connectionString, provider });
    }
}