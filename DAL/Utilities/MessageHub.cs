using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.SignalR;
using Models.Entities;

namespace DAL.Utilities;

[Authorize]
public class MessageHub(UserManager<User> userManager) : Hub
{
    // Connected IDs
    private static readonly ConcurrentDictionary<string, User> UserTable = new();

    public override async Task OnConnectedAsync()
    {
        if (Context.User?.Identity?.Name is { } identityName)
        {
            var user = await userManager.FindByNameAsync(identityName)
                       ?? await userManager.FindByEmailAsync(identityName);

            if (user != null)
            {
                UserTable[Context.ConnectionId] = user;

                await Clients.All.SendAsync("log", "joined", Context.ConnectionId, user.UserName);
            }
        }

        await Clients.All.SendAsync("count", UserTable.Count);
    }

    public override async Task OnDisconnectedAsync(Exception ex)
    {
        if (UserTable.TryRemove(Context.ConnectionId, out var user))
        {
            await Clients.All.SendAsync("log", "left", Context.ConnectionId, user.UserName);
        }

        await Clients.All.SendAsync("count", UserTable.Count);
    }
}