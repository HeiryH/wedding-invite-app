import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useRef, useState } from 'react';
import { describe, expect, it } from 'vitest';
import { useDialogBehavior } from './useDialogBehavior';

function Modal({ close }: { close: () => void }) {
  const ref = useRef<HTMLDivElement>(null); useDialogBehavior(ref, true, close);
  return <div ref={ref} tabIndex={-1} role="dialog"><button>First</button><button disabled>Disabled</button><button onClick={close}>Last</button></div>;
}
function Fixture() {
  const [open, setOpen] = useState(false);
  return <><button onClick={() => setOpen(true)}>Open</button>{open && <Modal close={() => setOpen(false)} />}</>;
}
describe('shared modal lifecycle', () => {
  it('moves focus inside, traps both tab directions, closes on Escape and restores focus/scroll', async () => {
    const previous = document.body.style.overflow; document.body.style.overflow = 'clip';
    const { unmount } = render(<Fixture />); const trigger = screen.getByText('Open'); trigger.focus(); fireEvent.click(trigger);
    await waitFor(() => expect(screen.getByText('First')).toHaveFocus());
    expect(document.body.style.overflow).toBe('hidden');
    fireEvent.keyDown(screen.getByText('First'), { key: 'Tab', shiftKey: true }); expect(screen.getByText('Last')).toHaveFocus();
    fireEvent.keyDown(screen.getByText('Last'), { key: 'Tab' }); expect(screen.getByText('First')).toHaveFocus();
    fireEvent.keyDown(screen.getByText('First'), { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull(); expect(trigger).toHaveFocus(); expect(document.body.style.overflow).toBe('clip');
    unmount(); document.body.style.overflow = previous;
  });
});
