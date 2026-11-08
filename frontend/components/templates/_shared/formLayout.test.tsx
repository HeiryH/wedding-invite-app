import { renderHook } from '@testing-library/react';
import { expect, it } from 'vitest';
import { T7_STAGES } from '../Template7-romangarden/data/stages';
import { T10_STAGES } from '../Template10-sunnysafari/data/stages';
import { T11_STAGES } from '../Template11-rosehorizon/data/roseHorizonStages';
import { T12_STAGES } from '../Template12-dreamywoodland/data/dreamyWoodlandStages';
import { T13_STAGES } from '../Template13-dinodoodle/data/stages';
import { T14_STAGES } from '../Template14-sandybeach/data/stages';
import { layoutKey, useStageLayout } from './layout';

it.each([
  ['t7', T7_STAGES], ['t10', T10_STAGES], ['t11', T11_STAGES],
  ['t12', T12_STAGES], ['t13', T13_STAGES], ['t14', T14_STAGES],
] as const)('%s switches the whole form flow and restores saved button geometry', (prefix, stages) => {
  const rsvpForm = stages.rsvp.layers.find((layer) => layer.slot === 'rsvpForm')!;
  const saved = { [layoutKey(prefix, 'mobile', 'rsvp')]: JSON.stringify({ layers: [{ id: rsvpForm.id, w: 63 }] }) };
  const { result, rerender } = renderHook(
    ({ config }: { config: Record<string, string> }) => useStageLayout(prefix, stages, ['rsvp', 'wishes'], 'mobile', config),
    { initialProps: { config: saved } },
  );
  const buttonLayouts = result.current;

  rerender({ config: { ...saved, 'rsvp.form_layout': 'inline', 'wish.form_layout': 'inline' } });
  for (const [stage, sheetId] of [[result.current[0], 'rsvp'], [result.current[1], 'wish']] as const) {
    expect(stage.def.flow).toBe(true);
    const flow = stage.layers.filter((layer) => layer.sheetId === sheetId);
    expect(flow).toHaveLength(2);
    expect(flow.every((layer) => layer.presentation === 'inline')).toBe(true);
  }
  expect(result.current[0].layers.find((layer) => layer.id === rsvpForm.id)?.w).toBe(63);

  rerender({ config: saved });
  expect(result.current).toEqual(buttonLayouts);
});
