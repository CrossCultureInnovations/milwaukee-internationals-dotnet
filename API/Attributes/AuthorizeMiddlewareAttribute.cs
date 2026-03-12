using System.Linq;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Models.Enums;

namespace API.Attributes;

public class AuthorizeMiddlewareAttribute : AuthorizeAttribute
{
    public AuthorizeMiddlewareAttribute() : this([])
    {
    }

    public AuthorizeMiddlewareAttribute(params UserRoleEnum[] userRoleEnums)
    {
        AuthenticationSchemes = $"Cookies,{JwtBearerDefaults.AuthenticationScheme}";

        if (!userRoleEnums.Any())
        {
            userRoleEnums = [UserRoleEnum.Basic];
        }

        Roles = userRoleEnums.JoinToString();
    }
}