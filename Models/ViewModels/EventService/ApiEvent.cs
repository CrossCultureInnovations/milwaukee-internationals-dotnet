using System;

namespace Models.ViewModels.EventService;

// C# record type for items in the table
public record ApiEvent
{
    public string RowKey { get; set; }

    public string PartitionKey { get; set; } = null!;
    
    public DateTimeOffset RecordedDate { get; set; }

    public string Description { get; set; }

    public DateTimeOffset? Timestamp { get; set; } = null!;
}