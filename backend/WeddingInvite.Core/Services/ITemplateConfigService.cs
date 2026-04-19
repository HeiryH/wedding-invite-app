namespace WeddingInvite.Core.Services
{
    public interface ITemplateConfigService
    {
        Task<Dictionary<string, string>> GetConfigAsync(int weddingId);
        Task SaveConfigAsync(int weddingId, Dictionary<string, string> config);
    }
}
