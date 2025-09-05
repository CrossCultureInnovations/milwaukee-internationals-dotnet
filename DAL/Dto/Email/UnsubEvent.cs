using Newtonsoft.Json;

namespace DAL.Dto.Email;

public class UnsubEvent : MailjetEvent
{
    [JsonProperty("mj_list_id")]
    public int MjListId { get; set; }
    
    [JsonProperty("ip")]
    public string Ip { get; set; }
    
    [JsonProperty("geo")]
    public string Geo { get; set; }
    
    [JsonProperty("agent")]
    public string Agent { get; set; }
}