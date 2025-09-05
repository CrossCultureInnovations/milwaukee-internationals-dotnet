using Newtonsoft.Json;

namespace DAL.Dto.Email;

public class SentEvent : MailjetEvent
{
    [JsonProperty("mj_message_id")]
    public string MjMessageId { get; set; } // Deprecated, see MessageID
    
    [JsonProperty("smtp_reply")]
    public string SmtpReply { get; set; }
}