import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import GuestRuntime from './GuestRuntime';
import { useGuestSubmission } from './useGuestSubmission';
import { MasterPreviewContext } from '../slots/preview';

function Form({ save }: { save: () => Promise<void> }) {
  const submission = useGuestSubmission(); const [done, setDone] = useState(false);
  return <><button onClick={async () => { if (await submission.submit(save, 'Failed')) setDone(true); }}>Send</button>{done && <p>Saved</p>}</>;
}
describe('guest execution modes', () => {
  it('preview blocks writes and false success even when a template is not editing', async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    render(<GuestRuntime preview><Form save={save} /></GuestRuntime>);
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Preview only');
    expect(save).not.toHaveBeenCalled(); expect(screen.queryByText('Saved')).toBeNull();
  });
  it('keeps simulation explicit and never calls live callbacks', async () => {
    const save = vi.fn();
    render(<MasterPreviewContext.Provider value><GuestRuntime><Form save={save} /></GuestRuntime></MasterPreviewContext.Provider>);
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Simulation only'); expect(save).not.toHaveBeenCalled();
  });
  it('live mode awaits the callback and reports success only after it resolves', async () => {
    const save = vi.fn().mockResolvedValue(undefined); render(<GuestRuntime><Form save={save} /></GuestRuntime>);
    fireEvent.click(screen.getByRole('button', { name: 'Send' })); expect(await screen.findByText('Saved')).toBeInTheDocument(); expect(save).toHaveBeenCalledOnce();
  });
});
