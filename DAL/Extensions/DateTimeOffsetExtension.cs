using System;
using TimeZoneConverter;

namespace DAL.Extensions;

public static class DateTimeOffsetExtension
{
    public static DateTimeOffset ToCentralTime(this DateTimeOffset dateTimeOffset)
    {
        var tzi = TZConvert.GetTimeZoneInfo("America/Chicago");
        
        return TimeZoneInfo.ConvertTime(dateTimeOffset, tzi);
    }
}