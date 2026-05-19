export const T6_DEFAULTS = {
  sceneQuality: 'auto' as const,
  fireflyCount: 'medium' as const,
  petalColor: '#f7c6d7',
  petalCount: 'medium' as const,
  bloom: true,
  fogColor: '#0d1a0e',
  environment: 'forest' as const,
  enchantmentLabel: 'Enchanted Garden',
  fireflyGreeting: 'Follow the light to our garden',
};

export const FIREFLY_COUNTS: Record<string, number> = {
  low: 40,
  medium: 100,
  high: 200,
};

export const PETAL_COUNTS: Record<string, number> = {
  none: 0,
  low: 20,
  medium: 60,
  high: 120,
};

export type SceneQuality = 'auto' | 'high' | 'low' | 'off';
export type Environment = 'forest' | 'night' | 'dawn';
