using System;

namespace Models.Constants;

public static class ApiConstants
{
    public const string AuthenticationSessionCookieName = "AuthenticationCookie";

    public static readonly string InviteCode = $"Tour{DateTime.UtcNow.Year}";

    public const string SiteUrl = "https://www.milwaukeeinternationals.com";

    /// <summary>
    /// The cohort anything outbound is addressed to. Records are stamped with
    /// this same calendar year when saved, so it always resolves to the people
    /// who registered this year — never a previous year's, whatever the
    /// admin-settable YearValue viewing context happens to be pointed at.
    /// A property, not a readonly field, so a long-running process still picks
    /// up the rollover.
    /// </summary>
    public static int CurrentYear => DateTime.UtcNow.Year;

    public static readonly string[] AdminEmail =
    [
        "asherimtiaz@gmail.com",
        "amirhesamyan@gmail.com"
    ];

    public const string SiteEmail = "tourofmilwaukee@gmail.com";

    public const string ApplicationName = "Milwaukee Internationals";
}