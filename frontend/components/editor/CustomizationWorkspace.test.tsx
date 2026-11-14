import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CustomizationWorkspace from './CustomizationWorkspace';

const mocks = vi.hoisted(() => ({
  get: vi.fn(), save: vi.fn(), publish: vi.fn(), restore: vi.fn(), export: vi.fn(), download: vi.fn(),
  getTemplate: vi.fn(), eventRead: vi.fn(), eventSave: vi.fn(),
  photoUpload: vi.fn(), itineraryRead: vi.fn(), push: vi.fn(),
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock('@/lib/auth', () => ({ getUser: () => ({ role: 'SUPER_ADMIN', tier: 'BASIC', weddingId: 32 }) }));
vi.mock('@/lib/api/templateStudio.service', () => ({ templateStudioService: {
  get: mocks.get, save: mocks.save, publish: mocks.publish, restore: mocks.restore, export: mocks.export,
} }));
vi.mock('@/lib/utils', async (original) => ({ ...await original<typeof import('@/lib/utils')>(), downloadBlob: mocks.download }));
vi.mock('@/lib/api', () => ({
  templateService: { getById: mocks.getTemplate },
  eventService: { getById: mocks.eventRead, update: mocks.eventSave },
  photoService: { upload: mocks.photoUpload },
  itineraryService: { getByWeddingId: mocks.itineraryRead },
  templateConfigService: {}, eventFeatureService: {}, audioService: {},
  TemplateSlots: { GROOM_PORTRAIT: 1, BRIDE_PORTRAIT: 2, EXTRA_1: 3, EXTRA_2: 4, EXTRA_3: 5, LAYER_IMAGE: 20 },
}));
vi.mock('@/app/organizer-admin/customize/_components/PreviewPanel', () => ({
  PreviewPanel: () => <div>Shared preview</div>,
  frameFromPreset: () => ({ w: 390, lvh: 844, svh: 700, scale: 1, safe: { top: 0, bottom: 0, left: 0, right: 0 } }),
}));
vi.mock('@/components/templates/_shared/adjust/AdjustPanel', () => ({
  default: ({ config, onGroupLayoutChange }: {
    config: Record<string, string>;
    onGroupLayoutChange: (key: string, value: string) => void;
  }) => {
    const key = 't7.layout.mobile.rsvp';
    return <div>
      <output aria-label="Group layout">{config[key] ?? 'No group'}</output>
      <button onClick={() => onGroupLayoutChange(key, '{"groups":[{"id":"decor","label":"Layer group","memberIds":["frame","pots"]}]}')}>Create test group</button>
      <button onClick={() => onGroupLayoutChange(key, '{"groups":[{"id":"decor","label":"RSVP decor","memberIds":["frame","pots"]}]}')}>Rename test group</button>
    </div>;
  },
}));
vi.mock('@/components/templates/_shared/cinematic/CinematicAdjustPanel', () => ({ default: () => <div>Cinematic Adjust</div> }));

const initial = { templateId: 7, version: 0, config: {}, sample: {}, revisions: [], updatedDate: null };

describe('master editor adapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getTemplate.mockResolvedValue({ templateId: 7, templateName: 'Roman Garden', templateCode: 'roman-garden', eventTypes: 'WEDDING', tier: 'PRO' });
    mocks.get.mockResolvedValue(initial);
    mocks.save.mockImplementation(async (_id, _version, config, sample) => ({ ...initial, version: 1, config, sample }));
  });
  afterEach(cleanup);

  it('undoes and redoes rapid group commands one at a time', async () => {
    render(<CustomizationWorkspace masterTemplateId={7} />);
    await screen.findByText('Roman Garden · Master');
    fireEvent.click(screen.getByRole('button', { name: 'Adjust' }));
    const layout = screen.getByLabelText('Group layout');
    fireEvent.click(screen.getByRole('button', { name: 'Create test group' }));
    fireEvent.click(screen.getByRole('button', { name: 'Rename test group' }));
    expect(layout).toHaveTextContent('RSVP decor');
    const undo = screen.getByRole('button', { name: /Undo/ });
    const redo = screen.getByRole('button', { name: /Redo/ });
    fireEvent.click(undo);
    expect(layout).toHaveTextContent('Layer group');
    fireEvent.click(undo);
    expect(layout).toHaveTextContent('No group');
    fireEvent.click(redo);
    expect(layout).toHaveTextContent('Layer group');
    fireEvent.click(redo);
    expect(layout).toHaveTextContent('RSVP decor');
  });

  it('saves sample edits to the template draft without touching a client event', async () => {
    render(<CustomizationWorkspace masterTemplateId={7} />);
    await screen.findByText('Roman Garden · Master');
    fireEvent.change(screen.getByDisplayValue('Grand Ballroom'), { target: { value: 'Sample garden' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Save draft' })[0]);
    await waitFor(() => expect(mocks.save).toHaveBeenCalledTimes(1));
    expect(mocks.save.mock.calls[0][0]).toBe(7);
    expect(mocks.save.mock.calls[0][3].wedding.venue).toBe('Sample garden');
    expect(mocks.eventRead).not.toHaveBeenCalled();
    expect(mocks.eventSave).not.toHaveBeenCalled();
    expect(mocks.photoUpload).not.toHaveBeenCalled();
    expect(mocks.itineraryRead).not.toHaveBeenCalled();
    expect(mocks.publish).not.toHaveBeenCalled();
    await screen.findByText('Draft saved. Published invitations are unchanged.');
  });

  it('publishes only a saved draft after the impact confirmation', async () => {
    mocks.get.mockResolvedValue({ ...initial, version: 1 });
    mocks.publish.mockResolvedValue({ ...initial, version: 2, revisions: [{ revision: 2, publishedDate: '2026-11-03T04:00:00Z' }] });
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<CustomizationWorkspace masterTemplateId={7} />);
    await screen.findByText('Roman Garden · Master');
    fireEvent.click(screen.getByRole('button', { name: 'Publish master' }));
    expect(mocks.publish).not.toHaveBeenCalled();
    confirm.mockReturnValue(true);
    fireEvent.click(screen.getByRole('button', { name: 'Publish master' }));
    await waitFor(() => expect(mocks.publish).toHaveBeenCalledWith(7, 1));
    await screen.findByText('Master published. Template previews and inherited invitation settings now use this design.');
    confirm.mockRestore();
  });

  it('shows save conflicts without writing any event data', async () => {
    mocks.save.mockRejectedValue({ response: { data: { message: 'Draft changed elsewhere. Reload.' } } });
    render(<CustomizationWorkspace masterTemplateId={7} />);
    await screen.findByText('Roman Garden · Master');
    fireEvent.change(screen.getByDisplayValue('Grand Ballroom'), { target: { value: 'New sample venue' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Save draft' })[0]);
    expect(await screen.findByRole('alert')).toHaveTextContent('Draft changed elsewhere. Reload.');
    expect(mocks.eventSave).not.toHaveBeenCalled();
  });

  it('exports the published snapshot using the current workspace version without publishing', async () => {
    const zip = new Blob(['published design'], { type: 'application/zip' });
    mocks.export.mockResolvedValue(zip);
    render(<CustomizationWorkspace masterTemplateId={7} />);
    await screen.findByText('Roman Garden · Master');
    fireEvent.click(screen.getByRole('button', { name: 'Export published' }));
    await waitFor(() => expect(mocks.download).toHaveBeenCalledWith('template-7-published.zip', zip));
    expect(mocks.export).toHaveBeenCalledWith(7, 0);
    expect(mocks.publish).not.toHaveBeenCalled();
    expect(mocks.eventSave).not.toHaveBeenCalled();
  });
});
