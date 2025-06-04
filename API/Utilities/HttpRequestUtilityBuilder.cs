using System.Threading.Tasks;
using API.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Models.Entities;
using Models.Enums;
using static Models.Enums.UserRoleEnumExtension;

namespace API.Utilities;

/// <summary>
/// UserInfo Struct
/// </summary>
public struct UserInfo
{
    public string Username { get; set; }

    public UserRoleEnum UserRoleEnum { get; set; }
}
    
public class HttpRequestUtility(UserManager<User> userManager, SignInManager<User> signInManager, HttpContext ctx)
{
    /// <summary>
    /// Extension method to quickly get the username/password
    /// </summary>
    /// <returns></returns>
    public async Task<UserInfo> GetUserInfo()
    {
        var user = await userManager.GetUserAsync(ctx.User);

        if (user == null)
        {
            return new UserInfo
            {
                Username = null,
                UserRoleEnum = UserRoleEnum.Basic
            };
        }

        var role = MostComprehensive(ParseRoles(await userManager.GetRolesAsync(user)));

        return new UserInfo
        {
            Username = user.UserName,
            UserRoleEnum = role
        };
    }

    /// <summary>
    /// Extension method to check whether user is logged in or not
    /// </summary>
    /// <returns></returns>
    public bool IsAuthenticated()
    {
        return signInManager.IsSignedIn(ctx.User);
    }
}
    
// ReSharper disable once UnusedMember.Global
public class HttpRequestUtilityBuilder(UserManager<User> userManager, SignInManager<User> signInManager)
    : IHttpRequestUtilityBuilder
{
    public HttpRequestUtility For(HttpContext ctx)
    {
        return new HttpRequestUtility(userManager, signInManager, ctx);
    }
}