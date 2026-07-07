using WeddingInvite.Core.Services;

namespace WeddingInvite.Tests;

/// <summary>Captures sends so tests can assert on email content without a real SMTP server.</summary>
public sealed class FakeEmailService : IEmailService
{
    public record Sent(string To, string Subject, string HtmlBody);

    public List<Sent> Sends { get; } = new();
    public bool IsConfigured => true;

    public Task SendAsync(string toEmail, string subject, string htmlBody, string? textBody = null)
    {
        Sends.Add(new Sent(toEmail, subject, htmlBody));
        return Task.CompletedTask;
    }
}
