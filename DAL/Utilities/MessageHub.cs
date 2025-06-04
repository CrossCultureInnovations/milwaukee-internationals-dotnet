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
    private static readonly IDictionary<string, User> UserTable = new ConcurrentDictionary<string, User>();

    public override async Task OnConnectedAsync()
    {
        if (Context.User != null)
        {
            var user = await userManager.FindByNameAsync(Context.User.Identity!.Name);

            UserTable[Context.ConnectionId] = user;

            await Clients.All.SendAsync("log", "joined", Context.ConnectionId, user.UserName);
        }

        await Clients.All.SendAsync("count", UserTable.Count);
    }

    public override async Task OnDisconnectedAsync(Exception ex)
    {
        var user = UserTable[Context.ConnectionId];
        
        UserTable.Remove(Context.ConnectionId);

        await Clients.All.SendAsync("log", "left", Context.ConnectionId, user.UserName);
        await Clients.All.SendAsync("count", UserTable.Count);
    }
}