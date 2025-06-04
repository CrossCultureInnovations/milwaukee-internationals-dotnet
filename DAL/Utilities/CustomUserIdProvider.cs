using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.SignalR;
using Models.Entities;

namespace DAL.Utilities;

public class CustomUserIdProvider(UserManager<User> userManager) : IUserIdProvider
{
    public string GetUserId(HubConnectionContext connection)
    {
        return userManager.FindByNameAsync(connection.User.Identity!.Name).Result.Id.ToString();
    }
}