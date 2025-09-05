using Newtonsoft.Json;

namespace DAL.Dto.Email;

public class ClickEvent : OpenEvent
{
    [JsonProperty("url")]
    public string Url { get; set; }
}