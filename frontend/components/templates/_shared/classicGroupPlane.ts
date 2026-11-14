import { SHIPPED_PROP_IDS as ROSE_PROPS } from '../Template11-rosehorizon/data/roseHorizonStages';
import { SHIPPED_PROP_IDS as WOODLAND_PROPS } from '../Template12-dreamywoodland/data/dreamyWoodlandStages';
import type { Layer } from './types';

/** Classic props and the section overlay can have separate stacking and layout contexts. */
export function classicGroupPlane(prefix: string, stageId: string, layer: Layer) {
  if (layer.kind === 'slot' || (prefix === 't5' && stageId === 'envelope')) return;
  const shipped = prefix === 't11' ? ROSE_PROPS : prefix === 't12' ? WOODLAND_PROPS : undefined;
  return layer.kind === 'img' && shipped?.[stageId]?.has(layer.id) ? 'props' : 'overlay';
}
