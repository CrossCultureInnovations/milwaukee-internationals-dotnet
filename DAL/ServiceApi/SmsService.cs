using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using DAL.Interfaces;
using Microsoft.Extensions.Logging;
using Models.Constants;
using PhoneNumbers;
using Telnyx;

namespace DAL.ServiceApi;

public class SmsService : ISmsService
{
    private readonly ILogger<SmsService> _logger;
    private readonly string _senderPhoneNumber;
    private readonly IConfigLogic _configLogic;

    public SmsService(string telnyxApiKey, string senderPhoneNumber, IConfigLogic configLogic, ILogger<SmsService> logger)
    {
        _senderPhoneNumber = senderPhoneNumber;
        _configLogic = configLogic;
        _logger = logger;
        TelnyxConfiguration.SetApiKey(telnyxApiKey);
    }

    public async Task SendMessage(string phoneNumber, string message)
    {
        var globalConfigs = await _configLogic.ResolveGlobalConfig();
        
        if (!string.IsNullOrWhiteSpace(phoneNumber))
        { 
            // ReSharper disable once TemplateIsNotCompileTimeConstantProblem
            _logger.LogInformation("Sending SMS to {}", phoneNumber);

            try
            {
                
                var service = new MessagingSenderIdService();
                var options = new NewMessagingSenderId
                {
                    From = NormalizePhoneNumberForSms(_senderPhoneNumber),
                    To = NormalizePhoneNumberForSms(globalConfigs.SmsTestMode
                        ? ApiConstants.SitePhoneNumber
                        : phoneNumber),
                    Text = message
                };

                var messageResponse = await service.CreateAsync(options);

                _logger.LogInformation("SMS sent successfully {}", messageResponse);
            }
            catch (Exception e)
            {
                _logger.LogInformation("SMS sent failed {}", e);
            }
        }
    }

    public async Task SendMessage(IEnumerable<string> phoneNumbers, string message)
    {
        await Task.WhenAll(phoneNumbers.Select(phoneNumber => SendMessage(phoneNumber, message)));
    }

    private static string NormalizePhoneNumberForSms(string phoneNumberRaw)
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
            var result = phoneNumberUtil.Format(phoneNumber, PhoneNumberFormat.RFC3966 /* DO NOT CHANGE */);

            return result.Replace("tel:", "").Replace("-", "");
        }
        catch (Exception)
        {
            return phoneNumberRaw;
        }
    }
}