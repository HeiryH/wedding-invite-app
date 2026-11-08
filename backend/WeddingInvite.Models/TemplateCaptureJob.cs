namespace WeddingInvite.Models;

public class TemplateCaptureJob
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public int TemplateId { get; set; }
    public string OwnerEmail { get; set; } = "";
    public string PublishedDesignHash { get; set; } = "";
    public int? PublishedRevision { get; set; }
    public string? PreviewSnapshotJson { get; set; }
    public string Status { get; set; } = "pending";
    public string? LeaseToken { get; set; }
    public string? Error { get; set; }
    public int Version { get; set; }
    public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
    public DateTime ExpiresAt { get; set; }
}
