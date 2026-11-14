using WeddingInvite.Core.Config;
using WeddingInvite.Data.Repositories;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace WeddingInvite.Core.Services
{
    public class TemplateConfigService : ITemplateConfigService
    {
        private readonly ITemplateConfigRepository _repo;
        private readonly ITemplateConfigDefaultRepository _defaultRepo;
        private readonly IEventRepository _eventRepo;
        private readonly ITemplateShippedDesignStore? _shippedDesigns;

        public TemplateConfigService(
            ITemplateConfigRepository repo,
            ITemplateConfigDefaultRepository defaultRepo,
            IEventRepository eventRepo,
            ITemplateShippedDesignStore? shippedDesigns = null)
        {
            _repo = repo;
            _defaultRepo = defaultRepo;
            _eventRepo = eventRepo;
            _shippedDesigns = shippedDesigns;
        }

        /// <summary>
        /// The effective config for an event: the template's captured "starting design" **underlaid**
        /// by the event's own rows (a stored key always wins). So every invite of a template renders
        /// that template's default for any key the couple hasn't personally overridden — and improving
        /// the default propagates live to those keys, with no re-seeding. A template with no captured
        /// default contributes nothing, so this is identical to returning the raw rows.
        /// </summary>
        public async Task<Dictionary<string, string>> GetConfigAsync(int eventId)
        {
            var result = await GetTemplateDefaultForEventAsync(eventId); // underlay (may be empty)

            var records = await _repo.GetByEventIdAsync(eventId);
            foreach (var r in records) result[r.ConfigKey] = r.ConfigValue;  // the couple's overrides win

            return result;
        }

        public async Task SaveConfigAsync(int eventId, Dictionary<string, string> config, string role, string? tier)
        {
            // Keys the caller may not write (admin-only for a couple, layout keys for sub-PRO) are
            // dropped rather than rejected: the customize page echoes back the whole config bag, so
            // refusing the request just because one forbidden key is present would break every save.
            // Dropping from the prune predicate too means those keys are preserved, not deleted.
            bool CanWrite(string key) => TemplateConfigPolicy.CanWrite(key, role, tier);

            // Store only *true overrides*. A submitted value equal to the template default is not
            // persisted — it falls back to the default via GetConfigAsync, so the invite keeps tracking
            // the default. That's also how "reset a stage" reverts to the theme's starting design: the
            // reset value matches the default (or the key is omitted), so no row is kept. Passing the
            // overrides (not the raw bag) to UpsertAsync means any writable stored key that now equals
            // the default — whether omitted or resubmitted-as-default — is pruned back to the default.
            var defaults = await GetTemplateDefaultForEventAsync(eventId);

            // A cinematic project is one logical document split into <=3,500-character config rows.
            // Per-row default pruning could otherwise retain only the changed chunks and later mix
            // them with chunks from a newer live template default. If any row differs, persist every
            // submitted row in that project so the manifest/chunks remain an atomic snapshot.
            var changedCinematicProjectKeys = new HashSet<string>(StringComparer.Ordinal);
            var projectGroups = config.Keys
                .Where(CanWrite)
                .Select(TemplateConfigPolicy.CinematicProjectBaseKey)
                .Where(p => p != null)
                .Distinct(StringComparer.Ordinal);
            foreach (var projectBase in projectGroups)
            {
                var submitted = config
                    .Where(kv => kv.Key == projectBase || kv.Key.StartsWith(projectBase + ".", StringComparison.Ordinal))
                    .ToDictionary(kv => kv.Key, kv => kv.Value, StringComparer.Ordinal);
                var inherited = defaults
                    .Where(kv => kv.Key == projectBase || kv.Key.StartsWith(projectBase + ".", StringComparison.Ordinal))
                    .ToDictionary(kv => kv.Key, kv => kv.Value, StringComparer.Ordinal);
                var differs = submitted.Count != inherited.Count || submitted.Any(kv =>
                    !inherited.TryGetValue(kv.Key, out var value) || value != kv.Value);
                if (differs) changedCinematicProjectKeys.UnionWith(submitted.Keys);
            }

            var overrides = config
                .Where(kv => CanWrite(kv.Key))
                .Where(kv => changedCinematicProjectKeys.Contains(kv.Key) ||
                    !(defaults.TryGetValue(kv.Key, out var d) && d == kv.Value))
                .ToDictionary(kv => kv.Key, kv => kv.Value, StringComparer.Ordinal);

            await _repo.UpsertAsync(eventId, overrides, CanWrite);
        }

        public async Task<Dictionary<string, string>> GetDefaultAsync(int templateId)
        {
            var result = _shippedDesigns == null ? new Dictionary<string, string>() : await _shippedDesigns.GetAsync(templateId);
            var published = await _defaultRepo.GetByTemplateIdAsync(templateId);
            // A cinematic project is one atomic document; never blend chunks from two revisions.
            foreach (var project in published.Keys.Select(TemplateConfigPolicy.CinematicProjectBaseKey).Where(x => x != null).Distinct())
                foreach (var key in result.Keys.Where(k => k == project || k.StartsWith(project + ".", StringComparison.Ordinal)).ToList()) result.Remove(key);
            foreach (var (key, value) in published) result[key] = value;
            return result;
        }

        public async Task<int> GetDefaultKeyCountAsync(int templateId) =>
            (await GetDefaultAsync(templateId)).Count;

        public async Task SetDefaultFromWeddingAsync(int templateId, int eventId)
        {
            // Capture the source invite's *effective* config (GetConfigAsync already merges in whatever
            // default it currently inherits), minus this couple's own content (rich-text bodies,
            // uploaded music). Everything else — layout, colours, scene, titles, order — is the design.
            var config = await GetConfigAsync(eventId);

            var design = PrepareDefaultDesign(config);
            await _defaultRepo.ReplaceAsync(templateId, design);
        }

        public static Dictionary<string, string> PrepareDefaultDesign(Dictionary<string, string> config)
        {
            var design = config
                .Where(kv => !TemplateConfigPolicy.IsCoupleContent(kv.Key))
                .ToDictionary(
                    kv => kv.Key,
                    // A lock is an editor affordance, not design — see StripLayerLocks. Capturing
                    // one made every invitation of the template open with that layer uneditable.
                    kv => TemplateConfigPolicy.IsLayoutKey(kv.Key) &&
                        TemplateConfigPolicy.CinematicProjectBaseKey(kv.Key) == null
                        ? TemplateConfigPolicy.StripLayerLocks(kv.Value)
                        : kv.Value,
                    StringComparer.Ordinal);

            ReassembleCapturedCinematicProjects(design);

            return design;
        }

        public Task ClearDefaultAsync(int templateId) =>
            _defaultRepo.ReplaceAsync(templateId, new Dictionary<string, string>());

        /// <summary>The captured default for an event's current template (empty if none / no event).</summary>
        private async Task<Dictionary<string, string>> GetTemplateDefaultForEventAsync(int eventId)
        {
            var evt = await _eventRepo.GetByIdAsync(eventId);
            if (evt == null) return new Dictionary<string, string>(StringComparer.Ordinal);
            return await GetDefaultAsync(evt.TemplateId);
        }

        /// <summary>
        /// Lock removal can change chunk lengths. Reassemble each logical project, strip locks from
        /// the complete JSON document, then rechunk it and update its manifest so capturing a starting
        /// design can never leave an unreadable project.
        /// </summary>
        internal static List<string> ReassembleCapturedCinematicProjects(Dictionary<string, string> design)
        {
            const int chunkSize = 3500;
            var documents = new List<string>();
            var projects = design.Keys
                .Select(TemplateConfigPolicy.CinematicProjectBaseKey)
                .Where(p => p != null)
                .Distinct(StringComparer.Ordinal)
                .ToList();
            foreach (var projectBase in projects)
            {
                if (!design.TryGetValue(projectBase!, out var manifestRaw)) continue;
                try
                {
                    using var manifest = JsonDocument.Parse(manifestRaw);
                    var root = manifest.RootElement;
                    var version = root.GetProperty("version").GetInt32();
                    var count = root.GetProperty("chunks").GetInt32();
                    if (count < 1) continue;
                    var parts = Enumerable.Range(0, count)
                        .Select(i => design.TryGetValue($"{projectBase}.{i}", out var part) ? part : null)
                        .ToList();
                    if (parts.Any(p => p == null)) continue;
                    var stripped = TemplateConfigPolicy.StripLayerLocks(string.Concat(parts.Select(p => p!)));
                    // Older Cinematic renderers require an explicit lock flag on complete custom
                    // layers. Keep them unlocked without dropping that required field.
                    var document = JsonNode.Parse(stripped) as JsonObject;
                    if (document?["layers"] is JsonObject worlds)
                    {
                        foreach (var world in worlds.Select(pair => pair.Value).OfType<JsonObject>())
                            if (world["layers"] is JsonArray layers)
                                foreach (var layer in layers.OfType<JsonObject>())
                                    if (layer.ContainsKey("id") && layer.ContainsKey("label") &&
                                        layer.ContainsKey("group") && layer.ContainsKey("space") &&
                                        layer.ContainsKey("x") && layer.ContainsKey("y") &&
                                        layer.ContainsKey("w") && layer.ContainsKey("opacity"))
                                        layer["locked"] = false;
                        stripped = document.ToJsonString();
                    }
                    var chunks = Enumerable.Range(0, (int)Math.Ceiling(stripped.Length / (double)chunkSize))
                        .Select(i => stripped.Substring(i * chunkSize, Math.Min(chunkSize, stripped.Length - i * chunkSize)))
                        .ToList();
                    foreach (var key in design.Keys.Where(k =>
                        k.StartsWith(projectBase + ".", StringComparison.Ordinal)).ToList()) design.Remove(key);
                    design[projectBase!] = JsonSerializer.Serialize(new
                    {
                        version,
                        chunks = chunks.Count,
                        length = stripped.Length,
                    });
                    for (var i = 0; i < chunks.Count; i++) design[$"{projectBase}.{i}"] = chunks[i];
                    documents.Add(stripped);
                }
                catch (JsonException)
                {
                    // Preserve malformed source data as-is; project resolution will fall back safely.
                }
            }
            return documents;
        }
    }
}
