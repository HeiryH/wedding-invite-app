namespace WeddingInvite.Models;

// A master draft is independent of both client events and live template defaults.
public class TemplateStudioDraft
{
    public int TemplateId { get; set; }
    public string ConfigJson { get; set; } = "{}";
    public string SampleJson { get; set; } = "{}";
    public int Version { get; set; }
    public string PublishedFingerprint { get; set; } = "";
    public DateTime UpdatedDate { get; set; } = DateTime.UtcNow;
}

public class TemplateStudioRevision
{
    public int TemplateStudioRevisionId { get; set; }
    public int TemplateId { get; set; }
    public int Revision { get; set; }
    public string ConfigJson { get; set; } = "{}";
    public DateTime PublishedDate { get; set; } = DateTime.UtcNow;
}
