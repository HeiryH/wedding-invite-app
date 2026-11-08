import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmEditorAction, EditorActions } from './EditorActions';

describe('scoped editor actions', () => {
  it('supports arrow navigation, Escape focus return and outside dismissal', () => {
    render(<><EditorActions label="Layer actions"><button>First action</button><button disabled>Unavailable</button><button>Last action</button></EditorActions><button>Outside</button></>);
    const trigger = screen.getByRole('button', { name: 'Layer actions' });
    const disclosure = trigger.closest('details')!;
    trigger.focus();
    fireEvent.keyDown(trigger, { key: 'ArrowUp' });
    expect(disclosure.open).toBe(true);
    expect(screen.getByRole('button', { name: 'Last action' })).toHaveFocus();
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown' });
    expect(screen.getByRole('button', { name: 'First action' })).toHaveFocus();
    fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
    expect(disclosure.open).toBe(false);
    expect(trigger).toHaveFocus();
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Outside' }));
    expect(disclosure.open).toBe(false);
  });

  it('requires explicit confirmation and lets cancellation preserve the design', () => {
    const confirm = vi.fn();
    render(<EditorActions label="Layer actions"><ConfirmEditorAction label="Delete layer" description="Only this layer is removed." onConfirm={confirm} /></EditorActions>);
    fireEvent.click(screen.getByRole('button', { name: 'Layer actions' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete layer' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Only this layer is removed.');
    expect(confirm).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(confirm).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Delete layer' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm delete layer' }));
    expect(confirm).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', { name: 'Layer actions' }).closest('details')!.open).toBe(false);
  });
});
