using System;

namespace Models.Constants;

public static class ApiConstants
{
    public const string AuthenticationSessionCookieName = "AuthenticationCookie";

    public static readonly string InviteCode = $"Tour{DateTime.UtcNow.Year}";

    public const string SiteUrl = "https://www.milwaukeeinternationals.com";

    public static readonly string[] AdminEmail =
    {
        "asherimtiaz@gmail.com",
        "amirhesamyan@gmail.com"
    };

    public const string SiteEmail = "tourofmilwaukee@gmail.com";

    public const string ApplicationName = "Milwaukee Internationals";
    
    public const string SitePhoneNumber = "+14147362240";
}