import { useEffect } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EngineProvider } from './engine';
import SheetHost from './SheetHost';
import { SheetsProvider, useSheets } from './slots/sheets';
import type { Layer, SlotProps } from './types';

const GROUPS = {
  rsvp: [{ id: 'rsvp-form', kind: 'slot', slot: 'test', presentation: 'sheet' }] as Layer[],
};

function OpenSheet() {
  const { open } = useSheets();
  useEffect(() => open('rsvp'), [open]);
  return <SheetHost groups={GROUPS} slotProps={{} as SlotProps} />;
}

describe('SheetHost', () => {
  it('only opens an editor sheet for a selection in that sheet’s stage', () => {
    const groups = { wish: [{ ...GROUPS.rsvp[0], id: 'form', sourceStageId: 'wishes' }] };
    const host = (selectedStage: string) => (
      <EngineProvider value={{ assetRoot: '', assetSizes: {}, slotRegistry: { test: () => <p>Wish form</p> } }}>
        <SheetsProvider>
          <SheetHost groups={groups} slotProps={{} as SlotProps}
            editor={{ enabled: true, breakpoint: 'mobile', selectedStage, selectedLayer: 'form' }} />
        </SheetsProvider>
      </EngineProvider>
    );
    const { rerender } = render(host('rsvp'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    rerender(host('wishes'));
    expect(screen.getByRole('dialog')).toHaveTextContent('Wish form');
  });

  it('exposes a modal dialog and dismisses it with Escape', async () => {
    render(
      <EngineProvider value={{
        assetRoot: '',
        assetSizes: {},
        slotRegistry: { test: () => <p>RSVP form</p> },
      }}>
        <SheetsProvider><OpenSheet /></SheetsProvider>
      </EngineProvider>,
    );

    expect(await screen.findByRole('dialog', { name: 'Invitation form' })).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});
