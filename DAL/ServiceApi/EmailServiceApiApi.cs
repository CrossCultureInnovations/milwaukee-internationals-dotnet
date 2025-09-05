using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.Serialization;
using System.Text;
using System.Threading.Tasks;
using DAL.Dto.Email;
using DAL.Interfaces;
using JsonSubTypes;
using Mailjet.Client;
using Mailjet.Client.Resources;
using Mailjet.Client.TransactionalEmails;
using Microsoft.Extensions.Logging;
using Models.Constants;
using Models.Extensions;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;

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
                .WithEventPayload(JsonConvert.SerializeObject(new EmailEventPayload
                {
                    From = emailSenderOnBehalf,
                    To = emailAddress,
                    Subject = emailSubject,
                    DateTime = DateTimeOffset.UtcNow
                }))
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
    
    public async Task Callback(MailjetEvent[] body)
    {
        foreach (var mailjetEvent in body)
        {
            switch (mailjetEvent.Event)
            {
                case MailjetEventType.Sent:
                case MailjetEventType.Open:
                case MailjetEventType.Click:
                case MailjetEventType.Unsub:
                    // Okay events
                    break;
                case MailjetEventType.Bounce:
                case MailjetEventType.Blocked:
                case MailjetEventType.Spam:
                    var reason = mailjetEvent.Event switch
                    {
                        MailjetEventType.Bounce => "bounced",
                        MailjetEventType.Blocked => "was blocked",
                        MailjetEventType.Spam => "was marked as spam",
                        _ => "failed"
                    };
                    
                    EmailEventPayload payload;
                    if (mailjetEvent.Payload != null && (payload = JsonConvert.DeserializeObject<EmailEventPayload>(mailjetEvent.Payload)) != null)
                    {
                        var sb = new StringBuilder()
                            .AppendLine($"To: {payload.To})")
                            .AppendLine($"Sent on: {payload.DateTime.ToCentralTime().ToString("MM/dd/yyyy HH:mm:ss")} (CST)")
                            .AppendLine($"Subject: {payload.Subject}")
                            .AppendLine(JsonConvert.SerializeObject(body, Formatting.Indented));
                        
                        await SendEmailAsync(ApiConstants.AdminEmail, $"Email {reason} callback", sb.ToString());
                    }
                    break;
                default:
                    throw new ArgumentOutOfRangeException();
            }
        }
    }
}

public class MailSenderRegistrationStatus
{
    public required bool Success { get; set; }
    
    public required string Message { get; set; }
}


[JsonConverter(typeof(StringEnumConverter))]
public enum MailjetEventType
{
    [EnumMember(Value = "sent")]
    Sent,
    [EnumMember(Value = "open")]
    Open,
    [EnumMember(Value = "click")]
    Click,
    [EnumMember(Value = "bounce")]
    Bounce,
    [EnumMember(Value = "blocked")]
    Blocked,
    [EnumMember(Value = "spam")]
    Spam,
    [EnumMember(Value = "unsub")]
    Unsub
}

[JsonConverter(typeof(JsonSubtypes), nameof(Event))]
[JsonSubtypes.KnownSubType(typeof(SentEvent), MailjetEventType.Sent)]
[JsonSubtypes.KnownSubType(typeof(OpenEvent), MailjetEventType.Open)]
[JsonSubtypes.KnownSubType(typeof(ClickEvent), MailjetEventType.Click)]
[JsonSubtypes.KnownSubType(typeof(BounceEvent), MailjetEventType.Bounce)]
[JsonSubtypes.KnownSubType(typeof(BlockedEvent), MailjetEventType.Blocked)]
[JsonSubtypes.KnownSubType(typeof(SpamEvent), MailjetEventType.Spam)]
[JsonSubtypes.KnownSubType(typeof(UnsubEvent), MailjetEventType.Unsub)]
public class MailjetEvent
{
    [JsonProperty("event")]
    public MailjetEventType Event { get; set; }
    
    [JsonProperty("time")]
    public long Time { get; set; }
    
    [JsonProperty("email")]
    public string Email { get; set; }
    
    [JsonProperty("mj_campaign_id")]
    public int MjCampaignId { get; set; }
    
    [JsonProperty("mj_contact_id")]
    public string MjContactId { get; set; }
    
    [JsonProperty("customcampaign")]
    public string Customcampaign { get; set; }
    
    [JsonProperty("MessageID")]
    public string MessageId { get; set; }
    
    [JsonProperty("Message_GUID")]
    public string MessageGuid { get; set; }
    
    [JsonProperty("CustomID")]
    public string CustomId { get; set; }
    
    [JsonProperty("Payload")]
    public string? Payload { get; set; }
}

internal class EmailEventPayload
{
    public string To { get; set; }
    
    public string From { get; set; }
    
    public string Subject { get; set; }
    
    public DateTimeOffset DateTime { get; set; }
}