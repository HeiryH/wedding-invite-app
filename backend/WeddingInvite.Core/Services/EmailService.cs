using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MimeKit;

namespace WeddingInvite.Core.Services
{
    /// <summary>
    /// Provider-agnostic SMTP email sender (works with Brevo, Gmail, SendGrid-SMTP, etc.).
    /// Configured via the "Email" section / env vars: Email__Host, Email__Port, Email__User,
    /// Email__Pass, Email__From, Email__FromName, Email__UseStartTls.
    /// Fail-soft by design: if unconfigured or the send fails, it logs and returns so that a
    /// flaky mail server never breaks signup/RSVP/reset flows.
    /// </summary>
    public class EmailService : IEmailService
    {
        private readonly ILogger<EmailService> _logger;
        private readonly string? _host;
        private readonly int _port;
        private readonly string? _user;
        private readonly string? _pass;
        private readonly string _from;
        private readonly string _fromName;
        private readonly bool _useStartTls;

        public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
        {
            _logger = logger;
            var email = configuration.GetSection("Email");
            _host = email["Host"];
            _port = int.TryParse(email["Port"], out var p) ? p : 587;
            _user = email["User"];
            _pass = email["Pass"];
            _from = email["From"] ?? _user ?? "no-reply@localhost";
            _fromName = email["FromName"] ?? "ODDSTUDIO";
            _useStartTls = !bool.TryParse(email["UseStartTls"], out var tls) || tls; // default true
        }

        public bool IsConfigured => !string.IsNullOrWhiteSpace(_host);

        public async Task SendAsync(string toEmail, string subject, string htmlBody, string? textBody = null)
        {
            if (!IsConfigured)
            {
                _logger.LogWarning("Email not sent to {To} ('{Subject}') — SMTP is not configured (set Email__Host).", toEmail, subject);
                return;
            }

            try
            {
                var message = new MimeMessage();
                message.From.Add(new MailboxAddress(_fromName, _from));
                message.To.Add(MailboxAddress.Parse(toEmail));
                message.Subject = subject;

                var builder = new BodyBuilder { HtmlBody = htmlBody, TextBody = textBody ?? StripHtml(htmlBody) };
                message.Body = builder.ToMessageBody();

                using var client = new SmtpClient();
                var socketOption = _useStartTls ? SecureSocketOptions.StartTls : SecureSocketOptions.SslOnConnect;
                await client.ConnectAsync(_host, _port, socketOption);
                if (!string.IsNullOrWhiteSpace(_user))
                    await client.AuthenticateAsync(_user, _pass);
                await client.SendAsync(message);
                await client.DisconnectAsync(true);

                _logger.LogInformation("Email sent to {To} ('{Subject}').", toEmail, subject);
            }
            catch (Exception ex)
            {
                // Fail-soft — the caller's flow (reset/RSVP) must not break because email failed.
                _logger.LogError(ex, "Failed to send email to {To} ('{Subject}').", toEmail, subject);
            }
        }

        private static string StripHtml(string html) =>
            System.Text.RegularExpressions.Regex.Replace(html, "<.*?>", string.Empty);
    }
}
