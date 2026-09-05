using System;
using System.Linq;
using Models.Interfaces;
using PhoneNumbers;

namespace Logic.Utilities;

public static class RegistrationUtility
{
    /// <summary>
    /// Normalize phone number to be consistent
    /// </summary>
    /// <param name="phoneNumberRaw"></param>
    /// <returns></returns>
    public static string NormalizePhoneNumber(string phoneNumberRaw)
    {
        if (string.IsNullOrWhiteSpace(phoneNumberRaw))
        {
            return phoneNumberRaw;
        }

        try
        {
            var phoneNumberUtil = PhoneNumberUtil.GetInstance();

            var phoneNumber = phoneNumberUtil.Parse(phoneNumberRaw, "US" /* DEFAULT REGION */);
                
            // We have people registering with phone number from different country, we don't want to lose the country code
            return phoneNumberUtil.Format(phoneNumber, PhoneNumberFormat.INTERNATIONAL /* DO NOT CHANGE */);
        }
        catch (Exception)
        {
            return phoneNumberRaw;
        }
    }
        
    /// <summary>
    /// Name to greet someone by. Falls back to the whole name when it is a single word.
    /// </summary>
    /// <param name="fullname"></param>
    /// <returns></returns>
    public static string FirstName(string fullname)
    {
        return fullname?.Trim().Split(' ').FirstOrDefault() ?? string.Empty;
    }

    /// <summary>
    /// Generates a display Id
    /// </summary>
    /// <param name="person"></param>
    /// <param name="count"></param>
    /// <returns></returns>
    public static string GenerateDisplayId(IPerson person, int count)
    {            
        return (string.Join(string.Empty, person.Fullname.Split(" ")
            .Select(x => x.Trim())
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Select(x => x[..1])) + "-" + ++count).ToUpper();
    }
}