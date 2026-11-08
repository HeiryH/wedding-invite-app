using WeddingInvite.Core.Services;

namespace WeddingInvite.API;

public class TemplateCaptureCleanup(IServiceScopeFactory scopes, ILogger<TemplateCaptureCleanup> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromMinutes(1));
        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            try
            {
                using var scope = scopes.CreateScope();
                await scope.ServiceProvider.GetRequiredService<TemplateCaptureService>().CleanupAsync();
            }
            catch (Exception e) when (!stoppingToken.IsCancellationRequested)
            { logger.LogWarning(e, "Could not clean up temporary template captures"); }
        }
    }
}
