using Newtonsoft.Json;

namespace DAL.Dto.Email;

public class SpamEvent : MailjetEvent
{
    [JsonProperty("source")]
    public string Source { get; set; }
}