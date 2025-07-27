using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using DAL.Interfaces;
using Mailjet.Client;
using Mailjet.Client.Resources;
using Mailjet.Client.TransactionalEmails;
using Microsoft.Extensions.Logging;
using Models.Constants;

namespace DAL.ServiceApi;

public class EmailServiceApi(IMailjetClient mailJetClient, IConfigLogic configLogic, ILogger<EmailServiceApi> logger)
    : IEmailServiceApi
{
    /// <summary>
    /// Send the email
    /// </summary>
    /// <param name="emailSenderOnBehalf"></param>
    /// <param name="emailAddress"></param>
    /// <param name="emailSubject"></param>
    /// <param name="emailHtml"></param>
    /// <param name="attachments"></param>
    /// <returns></returns>
    private async Task SendEmailAsync(string emailSenderOnBehalf, string emailAddress, string emailSubject, string emailHtml, params (string filename, string contentType, string content)[] attachments)
    {
        if (!string.IsNullOrWhiteSpace(emailAddress))
        { 
            // ReSharper disable once TemplateIsNotCompileTimeConstantProblem
            logger.LogInformation("Sending email to {}", emailAddress);
            
            // construct your email with builder
            var email = new TransactionalEmailBuilder()
                .WithFrom(new SendContact(emailSenderOnBehalf))
                .WithSubject(emailSubject)
                .WithHtmlPart(emailHtml)
                .WithAttachments(attachments.Select(x => new Attachment(x.filename, x.content, x.content)))
                .WithCc(new SendContact(ApiConstants.SiteEmail))
                .WithTo(new SendContact(emailAddress))
                .Build();

            // invoke API to send email
            var response = await mailJetClient.SendTransactionalEmailAsync(email);
                    
            // ReSharper disable once TemplateIsNotCompileTimeConstantProblem
            logger.LogInformation("Email sent successfully {}", response?.ToString());
        }
    }

    /// <summary>
    /// Send the email
    /// </summary>
    /// <param name="emailAddresses"></param>
    /// <param name="emailSubject"></param>
    /// <param name="emailHtml"></param>
    /// <param name="attachments"></param>
    /// <returns></returns>
    public async Task SendEmailAsync(IEnumerable<string> emailAddresses, string emailSubject, string emailHtml, params (string filename, string contentType, string content)[] attachments)
    {
        var globalConfigs = await configLogic.ResolveGlobalConfig();

        await Task.WhenAll(emailAddresses.Select(emailAddress => SendEmailAsync(
            globalConfigs.EmailSenderOnBehalf,
            globalConfigs.EmailTestMode ? ApiConstants.SiteEmail : emailAddress,
            emailSubject,
            emailHtml,
            attachments)));
    }
    
    
    public async Task<MailSenderRegistrationStatus> IsSenderRegistered(string email)
    {
        if (string.IsNullOrWhiteSpace(email))
        {
            return new MailSenderRegistrationStatus
            {
                Success = false,
                Message = $"Malformed email address {email}."
            };
        }

        var request = new MailjetRequest
        {
            Resource = Sender.Resource
        }
        .Filter(Sender.Email, email);
        
        var response = await mailJetClient.GetAsync(request);

        switch (response.IsSuccessStatusCode)
        {
            case true when response.GetTotal() > 0:
            {
                if (string.Equals(response.Content.SelectToken("Data")!.First!.Value<string>("Status"), "InActive", StringComparison.InvariantCultureIgnoreCase))
                {
                    return new MailSenderRegistrationStatus
                    {
                        Success = false,
                        Message = $"User {email} is registered to send email but inactive. Please check verification email from mailjet."
                    };
                }

                return new MailSenderRegistrationStatus
                {
                    Success = true,
                    Message = $"User {email} is registered and active to send emails."
                };
            }
            case true:
                return new MailSenderRegistrationStatus
                {
                    Success = false,
                    Message = $"User {email} is not registered to send emails."
                };
            default:
                return new MailSenderRegistrationStatus
                {
                    Success = false,
                    Message = $"Failed to get email sender registration status for {email}."
                };
        }
    }
}

public class MailSenderRegistrationStatus
{
    public required bool Success { get; set; }
    
    public required string Message { get; set; }
}