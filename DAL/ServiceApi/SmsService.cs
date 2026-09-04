using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using DAL.Interfaces;
using Microsoft.Extensions.Logging;
using Models.ViewModels;
using PhoneNumbers;
using SmsProxyHub.Client;

namespace DAL.ServiceApi;

public class SmsService(
    IConfigLogic configLogic,
    IHttpClientFactory httpClientFactory,
    ILogger<SmsService> logger) : ISmsService
{
    public async Task SendMessage(string phoneNumber, string message)
    {
        var globalConfigs = await configLogic.ResolveGlobalConfig();
        await SendMessage(phoneNumber, message, globalConfigs);
    }

    public async Task SendMessage(IEnumerable<string> phoneNumbers, string message)
    {
        var globalConfigs = await configLogic.ResolveGlobalConfig();
        await Task.WhenAll(phoneNumbers.Select(phoneNumber => SendMessage(phoneNumber, message, globalConfigs)));
    }

    private async Task SendMessage(string phoneNumber, string message, GlobalConfigModel globalConfigs)
    {
        if (string.IsNullOrWhiteSpace(phoneNumber)) return;

        if (string.IsNullOrWhiteSpace(globalConfigs.SmsProxyHubUrl) ||
            string.IsNullOrWhiteSpace(globalConfigs.SmsProxyHubToken) ||
            string.IsNullOrWhiteSpace(globalConfigs.SmsProxyHubConnectionId))
        {
            logger.LogWarning("SMS Proxy Hub is not configured. Set URL, API token and connection ID in global configuration");
            return;
        }

        if (!Guid.TryParse(globalConfigs.SmsProxyHubConnectionId, out var connectionId))
        {
            logger.LogError("SMS Proxy Hub connection ID is invalid");
            return;
        }

        var recipient = phoneNumber;
        if (globalConfigs.SmsTestMode)
        {
            if (string.IsNullOrWhiteSpace(globalConfigs.AdminPhoneNumber))
            {
                logger.LogWarning("SMS test mode is enabled but the admin phone number is not configured");
                return;
            }

            recipient = globalConfigs.AdminPhoneNumber;
            message = $"[for {phoneNumber}] {message}";
        }

        try
        {
            var httpClient = httpClientFactory.CreateClient("SmsProxyHub");
            httpClient.BaseAddress = new Uri(globalConfigs.SmsProxyHubUrl.TrimEnd('/'));
            var client = new SmsProxyHubClient(httpClient, globalConfigs.SmsProxyHubToken);
            var response = await client.SendSmsAsync<string>(
                connectionId,
                [NormalizePhoneNumberForSms(recipient)],
                message);
            var result = response.Results?.FirstOrDefault();

            if (result is { Status: "sent" })
            {
                logger.LogInformation("SMS sent via Proxy Hub to {PhoneNumber}, message ID {MessageId}", phoneNumber, result.MessageId);
                return;
            }

            logger.LogWarning("SMS Proxy Hub returned status {Status} for {PhoneNumber}", result?.Status, phoneNumber);
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "SMS Proxy Hub failed to send to {PhoneNumber}", phoneNumber);
        }
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