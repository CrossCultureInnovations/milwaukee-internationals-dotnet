﻿using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using DAL.Interfaces;
using Mailjet.Client;
using Mailjet.Client.TransactionalEmails;
using Microsoft.Extensions.Logging;
using Models.Constants;

namespace DAL.ServiceApi;

public class EmailServiceApi : IEmailServiceApi
{
    private readonly IMailjetClient _mailJetClient;
    private readonly IConfigLogic _configLogic;
    private readonly ILogger<EmailServiceApi> _logger;


    /// <summary>
    /// Constructor dependency injection
    /// </summary>
    /// <param name="mailJetClient"></param>
    /// <param name="configLogic"></param>
    /// <param name="logger"></param>
    public EmailServiceApi(IMailjetClient mailJetClient, IConfigLogic configLogic, ILogger<EmailServiceApi> logger)
    {
        _mailJetClient = mailJetClient;
        _configLogic = configLogic;
        _logger = logger;
    }

    /// <summary>
    /// Send the email
    /// </summary>
    /// <param name="emailAddress"></param>
    /// <param name="emailSubject"></param>
    /// <param name="emailHtml"></param>
    /// <returns></returns>
    public async Task SendEmailAsync(string emailAddress, string emailSubject, string emailHtml)
    {
        var globalConfigs = await _configLogic.ResolveGlobalConfig();
        
        if (!string.IsNullOrWhiteSpace(emailAddress))
        { 
            // ReSharper disable once TemplateIsNotCompileTimeConstantProblem
            _logger.LogInformation("Sending email to {}", emailAddress);
            
            // construct your email with builder
            var email = new TransactionalEmailBuilder()
                .WithFrom(new SendContact(globalConfigs.EmailSenderOnBehalf))
                .WithSubject(emailSubject)
                .WithHtmlPart(emailHtml)
                .WithCc(new SendContact(ApiConstants.SiteEmail))
                .WithTo(new SendContact(globalConfigs.EmailTestMode ? ApiConstants.SiteEmail : emailAddress))
                .Build();

            // invoke API to send email
            var response = await _mailJetClient.SendTransactionalEmailAsync(email);
                    
            // ReSharper disable once TemplateIsNotCompileTimeConstantProblem
            _logger.LogInformation("Email sent successfully {}", response?.ToString());
        }
    }

    /// <summary>
    /// Send the email
    /// </summary>
    /// <param name="emailAddresses"></param>
    /// <param name="emailSubject"></param>
    /// <param name="emailHtml"></param>
    /// <returns></returns>
    public async Task SendEmailAsync(IEnumerable<string> emailAddresses, string emailSubject, string emailHtml)
    {
        await Task.WhenAll(emailAddresses.Select(emailAddress => SendEmailAsync(emailAddress, emailSubject, emailHtml)));
    }
}