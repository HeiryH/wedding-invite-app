namespace WeddingInvite.Core.Services
{
    public interface IEmailService
    {
        /// <summary>True when SMTP settings are present. When false, SendAsync is a logged no-op.</summary>
        bool IsConfigured { get; }

        /// <summary>Sends an email. Fail-soft: never throws to the caller — logs and returns on error.</summary>
        Task SendAsync(string toEmail, string subject, string htmlBody, string? textBody = null);
    }
}
