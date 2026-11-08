import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ReferenceRail, { type CinematicReferenceControls } from './CinematicReferenceRail';

const props = (): CinematicReferenceControls => ({
  beat: { id: 'groom', label: 'Groom close-up', referenceSrc: '/details.png', referenceLabel: 'Details reference', referenceOpacity: .6 },
  visible: true, opacity: .45, onVisibleChange: vi.fn(), onChange: vi.fn(), onUploadImage: vi.fn().mockResolvedValue('/uploaded.png'),
});
describe('CinematicReferenceRail', () => {
  it('edits the selected beat opacity independently from eye visibility', () => {
    const p = props();
    const view = render(<ReferenceRail {...p} />);
    const slider = screen.getByRole('slider', { name: 'Reference opacity' });
    expect(slider).toHaveAttribute('aria-orientation', 'vertical');
    expect(slider).toHaveValue('0.6');
    fireEvent.change(slider, { target: { value: '.3' } });
    expect(p.onChange).toHaveBeenCalledWith('groom', { referenceOpacity: .3 });
    fireEvent.click(screen.getByRole('button', { name: 'Hide reference' }));
    expect(p.onVisibleChange).toHaveBeenCalledWith(false);
    view.rerender(<ReferenceRail {...p} visible={false} />);
    expect(slider).toBeDisabled();
    expect(slider).toHaveValue('0.6');
    expect(screen.getByRole('button', { name: 'Show reference' })).toHaveAttribute('aria-pressed', 'false');
  });
  it('opens contextual details, edits fit and supports Escape with focus return', () => {
    const p = props();
    render(<ReferenceRail {...p} />);
    const info = screen.getByRole('button', { name: 'Reference information' });
    fireEvent.click(info);
    expect(screen.getByRole('dialog', { name: 'Reference' })).toHaveTextContent('Groom close-up');
    expect(screen.getByAltText('Details reference')).toHaveAttribute('src', '/details.png');
    expect(screen.getByRole('button', { name: 'Close reference information' })).toHaveFocus();
    fireEvent.change(screen.getByLabelText('Reference fit'), { target: { value: 'cover' } });
    expect(p.onChange).toHaveBeenCalledWith('groom', { referenceFit: 'cover' });
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(info).toHaveFocus();
  });
  it('handles an empty beat and removes only its reference', () => {
    const p = props();
    const view = render(<ReferenceRail {...p} beat={{ id: 'empty', label: 'New beat' }} />);
    expect(screen.getByRole('slider')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Show reference' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Reference information' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('No reference image');
    expect(screen.getByRole('button', { name: 'Add reference' })).toBeEnabled();
    view.rerender(<ReferenceRail {...p} />);
    fireEvent.click(screen.getByRole('button', { name: 'Remove reference' }));
    expect(p.onChange).toHaveBeenCalledWith('groom', { referenceSrc: '', referenceLabel: '' });
  });
  it('uploads to the original beat even when selection changes before completion', async () => {
    const p = props();
    let resolve!: (url: string) => void;
    p.onUploadImage = vi.fn(() => new Promise<string>(done => { resolve = done; }));
    const view = render(<ReferenceRail key="groom" {...p} />);
    fireEvent.change(screen.getByLabelText('Upload reference image'), { target: { files: [new File(['image'], 'my-guide.png', { type: 'image/png' })] } });
    view.rerender(<ReferenceRail key="bride" {...p} beat={{ id: 'bride', label: 'Bride' }} />);
    await act(async () => { resolve('/uploaded.png'); });
    expect(p.onChange).toHaveBeenCalledWith('groom', { referenceSrc: '/uploaded.png', referenceLabel: 'my-guide.png' });
  });
  it('reports upload errors and closes on outside interaction', async () => {
    const p = props(); p.onUploadImage = vi.fn().mockRejectedValue(new Error('offline'));
    render(<ReferenceRail {...p} />);
    fireEvent.click(screen.getByRole('button', { name: 'Reference information' }));
    fireEvent.change(screen.getByLabelText('Upload reference image'), { target: { files: [new File(['image'], 'guide.png', { type: 'image/png' })] } });
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Could not upload'));
    expect(p.onChange).not.toHaveBeenCalled();
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
