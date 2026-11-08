import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Template3 from './Template3';
import Template4 from './Template4';
import PhotoBoothSection from './Template6-fairygarden/components/PhotoBoothSection';
import { SeatingPreviewContext } from './_shared/slots/preview';
import type { TemplateRenderProps } from './templateTypes';

vi.hoisted(() => {
  Object.defineProperty(window, 'matchMedia', { configurable: true, value: vi.fn(() => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} })) });
});

beforeEach(() => {
  vi.stubGlobal('IntersectionObserver', class { observe() {} unobserve() {} disconnect() {} });
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener() {}, removeEventListener() {} })));
  Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: vi.fn((file: File) => `blob:${file.name}`) });
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
});

const props = (): TemplateRenderProps => ({
  wedding: { templateId: 3, brideName: 'Alex', groomName: 'Sam', weddingDate: '2027-02-14T12:00:00+08:00', isRsvpOpen: true } as TemplateRenderProps['wedding'],
  wishes: [], photos: [], tables: [], photoBoothEnabled: true, seatingEnabled: true,
  onRSVP: vi.fn().mockResolvedValue(undefined), onSubmitWish: vi.fn().mockResolvedValue(undefined),
  onUploadPhoto: vi.fn().mockResolvedValue(undefined),
});

describe('local template regressions', () => {
  it('T6 passes an object payload to the public upload contract and resets the input', async () => {
    const onUploadPhoto = vi.fn().mockResolvedValue(undefined);
    const { container } = render(<PhotoBoothSection photos={[]} onUploadPhoto={onUploadPhoto} overlayProps={{ breakpoint: 'mobile' }} a={() => ({})} />);
    const input = container.querySelector('input')!;
    const file = new File(['image'], 'memory.jpg', { type: 'image/jpeg' });
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => expect(onUploadPhoto).toHaveBeenCalledWith({ file, guestName: 'Guest', caption: '' }));
    expect(input.value).toBe('');
  });

  it('T3 shows seating alone, retains answers on Back and submits once', async () => {
    const p = props(); const { container } = render(<Template3 {...p} />);
    const rsvp = within(container.querySelector('#rsvp')! as HTMLElement);
    fireEvent.change(rsvp.getByPlaceholderText('Your name *'), { target: { value: 'Nadia' } });
    fireEvent.submit(container.querySelector('#rsvp form')!);
    expect(rsvp.queryByPlaceholderText('Your name *')).not.toBeInTheDocument();
    expect(rsvp.getByText('Choose Your Table 🪑')).toBeInTheDocument();
    expect(p.onRSVP).not.toHaveBeenCalled();
    fireEvent.click(rsvp.getByRole('button', { name: '← Back' }));
    expect(rsvp.getByPlaceholderText('Your name *')).toHaveValue('Nadia');
    fireEvent.submit(container.querySelector('#rsvp form')!);
    fireEvent.click(rsvp.getByRole('button', { name: 'Submit RSVP 💌' }));
    await waitFor(() => expect(p.onRSVP).toHaveBeenCalledTimes(1));
    expect(rsvp.queryByText('Choose Your Table 🪑')).not.toBeInTheDocument();
  });

  it('T3 forced seating preview bypasses closed state without submitting', () => {
    const p = props(); p.wedding.isRsvpOpen = false;
    const dismiss = vi.fn();
    render(<SeatingPreviewContext.Provider value={{ dismiss }}><Template3 {...p} /></SeatingPreviewContext.Provider>);
    expect(screen.getByText('Choose Your Table 🪑')).toBeInTheDocument();
    expect(screen.queryByText('RSVPs are closed')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Submit RSVP 💌' }));
    expect(p.onRSVP).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: '← Back' }));
    expect(dismiss).toHaveBeenCalledOnce();
  });

  it.each([3, 4])('T%s releases image previews on replacement and unmount', async (id) => {
    const p = props();
    const Component = id === 3 ? Template3 : Template4;
    const { container, unmount } = render(<Component {...p} />);
    if (id === 4) fireEvent.click(screen.getByRole('button', { name: /Add your photo/i }));
    const input = container.querySelector('input[type=file]')!;
    fireEvent.change(input, { target: { files: [new File(['one'], 'one.jpg')] } });
    fireEvent.change(input, { target: { files: [new File(['two'], 'two.jpg')] } });
    await waitFor(() => expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:one.jpg'));
    unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:two.jpg');
  });
});
