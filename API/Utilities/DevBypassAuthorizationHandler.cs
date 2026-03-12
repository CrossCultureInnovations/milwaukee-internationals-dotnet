using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;

namespace API.Utilities;

/// <summary>
/// Bypasses all authorization requirements in Development mode.
/// </summary>
public class DevBypassAuthorizationHandler : IAuthorizationHandler
{
    public Task HandleAsync(AuthorizationHandlerContext context)
    {
        foreach (var requirement in context.PendingRequirements.ToList())
        {
            context.Succeed(requirement);
        }
        return Task.CompletedTask;
    }
}
