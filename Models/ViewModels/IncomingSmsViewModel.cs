using System;
using System.Collections.Generic;

namespace Models.ViewModels;

public class Media
{
    public string content_type { get; set; }
    
    public Uri url { get; set; }
}

public class Data
{
    public string event_type { get; set; }
    public string id { get; set; }
    public DateTime? occurred_at { get; set; }
    public Payload payload { get; set; }
    public string record_type { get; set; }
}

public class From
{
    public string carrier { get; set; }
    public string line_type { get; set; }
    public string phone_number { get; set; }
}

public class Meta
{
    public int? attempt { get; set; }
    public string delivered_to { get; set; }
}

public class Payload
{
    public object autoresponse_type { get; set; }
    public List<object> cc { get; set; }
    public object completed_at { get; set; }
    public object cost { get; set; }
    public string direction { get; set; }
    public string encoding { get; set; }
    public List<object> errors { get; set; }
    public From from { get; set; }
    public string id { get; set; }
    public bool? is_spam { get; set; }
    public List<Media> media { get; set; } = [];
    public string messaging_profile_id { get; set; }
    public string organization_id { get; set; }
    public int? parts { get; set; }
    public DateTime? received_at { get; set; }
    public string record_type { get; set; }
    public object sent_at { get; set; }
    public string subject { get; set; }
    public List<object> tags { get; set; }
    public string text { get; set; }
    public List<To> to { get; set; }
    public string type { get; set; }
    public object valid_until { get; set; }
    public object webhook_failover_url { get; set; }
    public string webhook_url { get; set; }
}

public class IncomingSmsViewModel
{
    public Data data { get; set; }
    public Meta meta { get; set; }
}

public class To
{
    public string carrier { get; set; }
    public string line_type { get; set; }
    public string phone_number { get; set; }
    public string status { get; set; }
}

