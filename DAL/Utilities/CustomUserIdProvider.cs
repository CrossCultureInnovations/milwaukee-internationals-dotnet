using System.Security.Claims;
using Microsoft.AspNetCore.SignalR;

namespace DAL.Utilities;

public class CustomUserIdProvider : IUserIdProvider
{
    public string GetUserId(HubConnectionContext connection)
    {
        return connection.User?.FindFirstValue(ClaimTypes.NameIdentifier)
               ?? connection.User?.Identity?.Name;
    }
}
