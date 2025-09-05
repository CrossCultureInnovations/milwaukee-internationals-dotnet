using System.Runtime.Serialization;
using JsonSubTypes;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;

namespace DAL.Dto.Email;

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