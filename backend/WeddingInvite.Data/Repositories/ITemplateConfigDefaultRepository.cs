namespace WeddingInvite.Data.Repositories
{
    public interface ITemplateConfigDefaultRepository
    {
        /// <summary>The stored starting-design bag for a template (empty when none is set).</summary>
        Task<Dictionary<string, string>> GetByTemplateIdAsync(int templateId);

        /// <summary>How many keys are stored — cheap status check for the admin UI.</summary>
        Task<int> CountAsync(int templateId);

        /// <summary>
        /// Replace the template's entire default bag with <paramref name="configs"/> (delete existing
        /// rows, insert the new set). Idempotent capture; an empty map clears the default.
        /// </summary>
        Task ReplaceAsync(int templateId, Dictionary<string, string> configs);
    }
}
