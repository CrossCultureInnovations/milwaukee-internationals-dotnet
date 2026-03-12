using System;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.DependencyInjection;
using Models.Entities;

namespace DAL.Utilities;

public class CustomUserIdProvider(IServiceProvider serviceProvider) : IUserIdProvider
{
    public string GetUserId(HubConnectionContext connection)
    {
        using var scope = serviceProvider.CreateScope();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<User>>();
        return userManager.FindByNameAsync(connection.User.Identity!.Name!).Result!.Id.ToString();
    }
}
