using Newtonsoft.Json;

namespace DAL.Dto.Email;

public class BlockedEvent : MailjetEvent
{
    [JsonProperty("error_related_to")]
    public string ErrorRelatedTo { get; set; }
    
    [JsonProperty("error")]
    public string Error { get; set; }
}