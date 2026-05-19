'use client';
import { useMemo } from 'react';
import {
  T6_DEFAULTS,
  FIREFLY_COUNTS,
  PETAL_COUNTS,
  SceneQuality,
  Environment,
} from '../data/defaultConfig';

export interface FairyConfig {
  quality: SceneQuality;
  fireflyCount: number;
  petalColor: string;
  petalCount: number;
  bloom: boolean;
  fogColor: string;
  environment: Environment;
  enchantmentLabel: string;
  fireflyGreeting: string;
}

export function useFairyConfig(customConfig?: Record<string, string>): FairyConfig {
  return useMemo(() => {
    const c = customConfig ?? {};
    const quality = (c['scene.quality'] ?? T6_DEFAULTS.sceneQuality) as SceneQuality;
    const fireflyKey = c['scene.firefly.count'] ?? T6_DEFAULTS.fireflyCount;
    const petalKey = c['scene.petal.count'] ?? T6_DEFAULTS.petalCount;

    return {
      quality,
      fireflyCount: FIREFLY_COUNTS[fireflyKey] ?? FIREFLY_COUNTS.medium,
      petalColor: c['scene.petal.color'] ?? T6_DEFAULTS.petalColor,
      petalCount: PETAL_COUNTS[petalKey] ?? PETAL_COUNTS.medium,
      bloom: (c['scene.bloom'] ?? 'true') === 'true',
      fogColor: c['scene.fog.color'] ?? T6_DEFAULTS.fogColor,
      environment: (c['scene.environment'] ?? T6_DEFAULTS.environment) as Environment,
      enchantmentLabel: c['invite.enchantment_label'] ?? T6_DEFAULTS.enchantmentLabel,
      fireflyGreeting: c['invite.firefly_greeting'] ?? T6_DEFAULTS.fireflyGreeting,
    };
  }, [customConfig]);
}
