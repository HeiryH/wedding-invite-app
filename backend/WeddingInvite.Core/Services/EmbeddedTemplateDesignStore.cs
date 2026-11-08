using System.Text.Json;
using WeddingInvite.Data.Repositories;

namespace WeddingInvite.Core.Services;

public interface ITemplateShippedDesignStore
{
    Task<Dictionary<string, string>> GetAsync(int templateId);
    string? GetThumbnail(string templateCode) => null;
    byte[]? GetAsset(string url) => null;
}

// Baked Studio designs are compiled into the assembly, so a fresh database can render them.
// Templates are matched by stable code, never by an environment-specific numeric id.
public class EmbeddedTemplateDesignStore(ITemplateRepository templates) : ITemplateShippedDesignStore
{
    private record Design(Dictionary<string, string> Config, string? Thumbnail, HashSet<string> Assets);
    private static readonly Lazy<Dictionary<string, Design>> Designs = new(Load);

    private static Dictionary<string, Design> Load()
    {
        var result = new Dictionary<string, Design>(StringComparer.Ordinal);
        var assembly = typeof(EmbeddedTemplateDesignStore).Assembly;
        foreach (var name in assembly.GetManifestResourceNames().Where(x => x.StartsWith("TemplateDesigns.", StringComparison.Ordinal) && x.EndsWith(".json", StringComparison.Ordinal)))
        {
            using var stream = assembly.GetManifestResourceStream(name)!;
            using var json = JsonDocument.Parse(stream);
            var root = json.RootElement;
            if (root.GetProperty("schemaVersion").GetInt32() != 1) throw new InvalidOperationException($"Unsupported shipped design: {name}");
            var code = root.GetProperty("templateCode").GetString()!;
            var config = root.GetProperty("config").Deserialize<Dictionary<string, string>>()!;
            var thumbnail = root.TryGetProperty("thumbnailUrl", out var thumb) ? thumb.GetString() : null;
            var assets = root.TryGetProperty("assets", out var refs) ? refs.Deserialize<HashSet<string>>() ?? new() : new HashSet<string>();
            if (!result.TryAdd(code, new(config, thumbnail, assets))) throw new InvalidOperationException($"Duplicate shipped design: {code}");
        }
        return result;
    }

    public async Task<Dictionary<string, string>> GetAsync(int templateId)
    {
        var template = await templates.GetByIdAsync(templateId);
        return template != null && Designs.Value.TryGetValue(template.TemplateCode, out var design)
            ? new(design.Config, StringComparer.Ordinal) : new(StringComparer.Ordinal);
    }

    public string? GetThumbnail(string templateCode) => Designs.Value.TryGetValue(templateCode, out var design) ? design.Thumbnail : null;

    public byte[]? GetAsset(string url)
    {
        if (!Designs.Value.Values.Any(x => x.Assets.Contains(url))) return null;
        using var stream = typeof(EmbeddedTemplateDesignStore).Assembly.GetManifestResourceStream("TemplateDesignAssets." + url.Split('/').Last());
        if (stream == null) throw new InvalidOperationException($"Shipped template asset is missing: {url}");
        using var buffer = new MemoryStream();
        stream.CopyTo(buffer);
        return buffer.ToArray();
    }
}
