using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;

namespace API.Middlewares;

public class EnableRequestRewindMiddleware(RequestDelegate next)
{
    /// <summary>
    ///     On any action ...
    /// </summary>
    /// <param name="context"></param>
    /// <returns></returns>
    // ReSharper disable once UnusedMember.Global
    public async Task Invoke(HttpContext context)
    {
        context.Request.EnableBuffering();

        await next(context);
    }
}