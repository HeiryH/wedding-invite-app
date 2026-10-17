import { cinematicCameraKey } from './cameraLayout';
import { cinematicSceneSetsKey } from './sceneSets';
import { cinematicSequenceKey } from './sequence';
import { cinematicVisibilityKey } from './visibility';
import { cinematicWorldKey } from './world';

export const CINEMATIC_PROJECT_VERSION = 1 as const;
export const CINEMATIC_PROJECT_CHUNK_SIZE = 3500;

type JsonObject = Record<string, unknown>;

/**
 * The single logical cinematic project. Large projects are split across config rows solely because
 * the config store limits one value to 4,000 characters; chunks are transport, not separate models.
 */
export interface CinematicProject {
  version: typeof CINEMATIC_PROJECT_VERSION;
  sceneSets: JsonObject;
  layers: { mobile: JsonObject; desktop: JsonObject };
  sequence: JsonObject;
  cameras: { mobile: JsonObject; desktop: JsonObject };
  visibility: { mobile: JsonObject; desktop: JsonObject };
  pacing: JsonObject;
  effects: JsonObject;
  interactions: JsonObject;
  navigation: JsonObject;
  theme: JsonObject;
}

export interface CinematicProjectIssue {
  path: string;
  message: string;
}

interface ProjectManifest {
  version: typeof CINEMATIC_PROJECT_VERSION;
  chunks: number;
  length: number;
}

export const cinematicProjectKey = (prefix: string) => `${prefix}.layout.cinematic-project`;
export const cinematicProjectChunkKey = (prefix: string, index: number) =>
  `${cinematicProjectKey(prefix)}.${index}`;

export function cinematicLegacyKeys(prefix: string): string[] {
  return [
    cinematicSceneSetsKey(prefix),
    cinematicSequenceKey(prefix),
    cinematicWorldKey(prefix, 'mobile'),
    cinematicWorldKey(prefix, 'desktop'),
    cinematicCameraKey(prefix, 'mobile'),
    cinematicCameraKey(prefix, 'desktop'),
    cinematicVisibilityKey(prefix, 'mobile'),
    cinematicVisibilityKey(prefix, 'desktop'),
  ];
}

export function isCinematicLegacyKey(prefix: string, key: string): boolean {
  return cinematicLegacyKeys(prefix).includes(key);
}

const emptyProject = (): CinematicProject => ({
  version: CINEMATIC_PROJECT_VERSION,
  sceneSets: { version: 1, sets: [] },
  layers: { mobile: { layers: [] }, desktop: { layers: [] } },
  sequence: { version: 1, beats: [], tracks: [] },
  cameras: { mobile: { frames: [] }, desktop: { frames: [] } },
  visibility: { mobile: { sets: [] }, desktop: { sets: [] } },
  pacing: {}, effects: {}, interactions: {}, navigation: {}, theme: {},
});

function parseObject(raw: string | undefined): JsonObject | undefined {
  if (!raw) return undefined;
  try {
    const value: unknown = JSON.parse(raw);
    return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonObject : undefined;
  } catch {
    return undefined;
  }
}

const isObject = (value: unknown): value is JsonObject =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

function captureLegacyProject(prefix: string, config: Record<string, string>): CinematicProject {
  const project = emptyProject();
  project.sceneSets = parseObject(config[cinematicSceneSetsKey(prefix)]) ?? project.sceneSets;
  project.sequence = parseObject(config[cinematicSequenceKey(prefix)]) ?? project.sequence;
  project.layers.mobile = parseObject(config[cinematicWorldKey(prefix, 'mobile')]) ?? project.layers.mobile;
  project.layers.desktop = parseObject(config[cinematicWorldKey(prefix, 'desktop')]) ?? project.layers.desktop;
  project.cameras.mobile = parseObject(config[cinematicCameraKey(prefix, 'mobile')]) ?? project.cameras.mobile;
  project.cameras.desktop = parseObject(config[cinematicCameraKey(prefix, 'desktop')]) ?? project.cameras.desktop;
  project.visibility.mobile = parseObject(config[cinematicVisibilityKey(prefix, 'mobile')]) ?? project.visibility.mobile;
  project.visibility.desktop = parseObject(config[cinematicVisibilityKey(prefix, 'desktop')]) ?? project.visibility.desktop;
  return project;
}

function projectLegacyConfig(prefix: string, project: CinematicProject): Record<string, string> {
  return {
    [cinematicSceneSetsKey(prefix)]: JSON.stringify(project.sceneSets),
    [cinematicSequenceKey(prefix)]: JSON.stringify(project.sequence),
    [cinematicWorldKey(prefix, 'mobile')]: JSON.stringify(project.layers.mobile),
    [cinematicWorldKey(prefix, 'desktop')]: JSON.stringify(project.layers.desktop),
    [cinematicCameraKey(prefix, 'mobile')]: JSON.stringify(project.cameras.mobile),
    [cinematicCameraKey(prefix, 'desktop')]: JSON.stringify(project.cameras.desktop),
    [cinematicVisibilityKey(prefix, 'mobile')]: JSON.stringify(project.visibility.mobile),
    [cinematicVisibilityKey(prefix, 'desktop')]: JSON.stringify(project.visibility.desktop),
  };
}

export function readCinematicProject(
  prefix: string,
  config: Record<string, string> | undefined,
): { project?: CinematicProject; issues: CinematicProjectIssue[] } {
  const issues: CinematicProjectIssue[] = [];
  if (!config) return { issues };
  const key = cinematicProjectKey(prefix);
  const manifest = parseObject(config[key]) as Partial<ProjectManifest> | undefined;
  if (!manifest) return { issues };
  if (manifest.version !== CINEMATIC_PROJECT_VERSION || !Number.isInteger(manifest.chunks) ||
    !manifest.chunks || manifest.chunks < 1 || !Number.isInteger(manifest.length) || manifest.length! < 1) {
    issues.push({ path: 'project.manifest', message: 'Cinematic project manifest is invalid.' });
    return { issues };
  }
  const parts: string[] = [];
  for (let index = 0; index < manifest.chunks; index += 1) {
    const part = config[cinematicProjectChunkKey(prefix, index)];
    if (part === undefined) {
      issues.push({ path: `project.chunks.${index}`, message: 'Cinematic project chunk is missing.' });
      return { issues };
    }
    parts.push(part);
  }
  const raw = parts.join('');
  if (raw.length !== manifest.length) {
    issues.push({ path: 'project.length', message: 'Cinematic project length does not match its manifest.' });
    return { issues };
  }
  try {
    const value = JSON.parse(raw) as Partial<CinematicProject>;
    if (value.version !== CINEMATIC_PROJECT_VERSION || !isObject(value.sceneSets) ||
      !isObject(value.layers) || !isObject(value.layers.mobile) || !isObject(value.layers.desktop) ||
      !isObject(value.sequence) || !isObject(value.cameras) || !isObject(value.cameras.mobile) ||
      !isObject(value.cameras.desktop) || !isObject(value.visibility) ||
      !isObject(value.visibility.mobile) || !isObject(value.visibility.desktop)) {
      issues.push({ path: 'project', message: 'Cinematic project document is incomplete.' });
      return { issues };
    }
    const defaults = emptyProject();
    return {
      project: {
        ...defaults,
        ...value,
        pacing: isObject(value.pacing) ? value.pacing : defaults.pacing,
        effects: isObject(value.effects) ? value.effects : defaults.effects,
        interactions: isObject(value.interactions) ? value.interactions : defaults.interactions,
        navigation: isObject(value.navigation) ? value.navigation : defaults.navigation,
        theme: isObject(value.theme) ? value.theme : defaults.theme,
      } as CinematicProject,
      issues,
    };
  } catch {
    issues.push({ path: 'project', message: 'Cinematic project document is not valid JSON.' });
    return { issues };
  }
}

/** Materializes a project back into the legacy resolver keys during the compatibility window. */
export function resolveCinematicProjectConfig(
  prefix: string,
  config: Record<string, string> | undefined,
): { config: Record<string, string>; project: CinematicProject; issues: CinematicProjectIssue[]; source: 'project' | 'legacy' } {
  const source = config ?? {};
  const read = readCinematicProject(prefix, source);
  const project = read.project ?? captureLegacyProject(prefix, source);
  const materialized = { ...source, ...projectLegacyConfig(prefix, project) };
  // Unsaved legacy-shaped edits deliberately win over the project document. Consolidation removes
  // them when the draft is written, keeping old callbacks compatible while migration lands.
  for (const key of cinematicLegacyKeys(prefix)) {
    if (source[key] !== undefined) materialized[key] = source[key];
  }
  return { config: materialized, project, issues: read.issues, source: read.project ? 'project' : 'legacy' };
}

function removeProjectTransport(prefix: string, config: Record<string, string>): Record<string, string> {
  const next = { ...config };
  const base = cinematicProjectKey(prefix);
  for (const key of Object.keys(next)) {
    if (key === base || key.startsWith(`${base}.`)) delete next[key];
  }
  return next;
}

export function writeCinematicProject(
  prefix: string,
  config: Record<string, string>,
  project: CinematicProject,
): Record<string, string> {
  const next = removeProjectTransport(prefix, config);
  for (const key of cinematicLegacyKeys(prefix)) delete next[key];
  const raw = JSON.stringify(project);
  const chunks = Math.ceil(raw.length / CINEMATIC_PROJECT_CHUNK_SIZE);
  next[cinematicProjectKey(prefix)] = JSON.stringify({
    version: CINEMATIC_PROJECT_VERSION, chunks, length: raw.length,
  } satisfies ProjectManifest);
  for (let index = 0; index < chunks; index += 1) {
    next[cinematicProjectChunkKey(prefix, index)] = raw.slice(
      index * CINEMATIC_PROJECT_CHUNK_SIZE,
      (index + 1) * CINEMATIC_PROJECT_CHUNK_SIZE,
    );
  }
  return next;
}

/** Consolidates old keys or unsaved compatibility edits into the single logical project. */
export function migrateCinematicConfigToProject(
  prefix: string,
  config: Record<string, string>,
): Record<string, string> {
  const resolved = resolveCinematicProjectConfig(prefix, config);
  const effectiveLegacy = Object.fromEntries(cinematicLegacyKeys(prefix).flatMap((key) =>
    resolved.config[key] === undefined ? [] : [[key, resolved.config[key]]]));
  const project = captureLegacyProject(prefix, effectiveLegacy);
  const existing = resolved.project;
  project.pacing = existing.pacing;
  project.effects = existing.effects;
  project.interactions = existing.interactions;
  project.navigation = existing.navigation;
  project.theme = existing.theme;
  return writeCinematicProject(prefix, config, project);
}

export function updateCinematicProjectValue(
  prefix: string,
  config: Record<string, string>,
  key: string,
  value: string,
): Record<string, string> {
  if (!isCinematicLegacyKey(prefix, key)) return config;
  const resolved = resolveCinematicProjectConfig(prefix, config);
  const effective = { ...resolved.config };
  if (value === '') delete effective[key];
  else effective[key] = value;
  // An explicit reset must beat the value materialized from the previous project.
  const project = captureLegacyProject(prefix, {
    ...Object.fromEntries(cinematicLegacyKeys(prefix).map((legacyKey) => [legacyKey, effective[legacyKey]])),
    [key]: value || JSON.stringify(
      key.includes('cinematic-sequence') ? { version: 1, beats: [], tracks: [] }
        : key.includes('cinematic-scene-sets') ? { version: 1, sets: [] }
          : key.includes('cinematic-world') ? { layers: [] }
            : key.includes('cinematic-camera') ? { frames: [] }
              : { sets: [] },
    ),
  } as Record<string, string>);
  project.pacing = resolved.project.pacing;
  project.effects = resolved.project.effects;
  project.interactions = resolved.project.interactions;
  project.navigation = resolved.project.navigation;
  project.theme = resolved.project.theme;
  return writeCinematicProject(prefix, config, project);
}

export function resetCinematicProjectConfig(
  prefix: string,
  config: Record<string, string>,
): Record<string, string> {
  const next = removeProjectTransport(prefix, config);
  for (const key of cinematicLegacyKeys(prefix)) delete next[key];
  return next;
}
