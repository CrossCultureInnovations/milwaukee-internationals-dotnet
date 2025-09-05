using Newtonsoft.Json;

namespace DAL.Dto.Email;

public class BounceEvent : MailjetEvent
{
    [JsonProperty("blocked")]
    public bool Blocked { get; set; }
    
    [JsonProperty("hard_bounce")]
    public bool HardBounce { get; set; }
    
    [JsonProperty("error_related_to")]
    public string ErrorRelatedTo { get; set; }
    
    [JsonProperty("error")]
    public string Error { get; set; }
    
    [JsonProperty("comment")]
    public string Comment { get; set; }
}