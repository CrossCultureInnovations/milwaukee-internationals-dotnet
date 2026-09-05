namespace Models.ViewModels;

/// <summary>
/// One rendered email, exactly as it would be sent. Built by the same code
/// that sends, so a preview cannot drift from what recipients receive.
/// </summary>
public class EmailPreviewViewModel
{
    /// <summary>
    /// Address this copy would be sent to
    /// </summary>
    public string To { get; set; }

    /// <summary>
    /// Name of the recipient, for labelling the preview
    /// </summary>
    public string RecipientName { get; set; }

    /// <summary>
    /// Subject line
    /// </summary>
    public string Subject { get; set; }

    /// <summary>
    /// HTML body
    /// </summary>
    public string Body { get; set; }
}
