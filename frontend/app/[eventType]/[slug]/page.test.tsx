import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TemplateRenderProps } from '@/components/templates/templateTypes';

const state = vi.hoisted(() => ({
  router: { replace: vi.fn() }, id: 3, authored: false, failMetadata: false, rendered: vi.fn(), metadata: vi.fn(), rsvp: vi.fn(),
}));
vi.mock('next/navigation', () => ({
  useParams: () => ({ eventType: 'wedding', slug: 'qa' }),
  useRouter: () => state.router,
  useSearchParams: () => ({ get: () => null }),
}));
vi.mock('@/components/templates/TemplateWrapper', () => ({ default: (props: TemplateRenderProps) => {
  state.rendered(props); return <p>Rendered template {props.wedding.templateId}</p>;
} }));
vi.mock('@/lib/api', () => ({
  eventService: { getBySlug: async () => ({ eventId: 999, slug: 'qa', eventType: 'WEDDING', isPublic: true, isActive: true, name1: 'Alex', name2: 'Sam', eventDate: '2027-02-14', templateId: state.id }) },
  templateService: { getById: async (id: number) => {
    state.metadata(id); if (state.failMetadata) throw new Error('Not found');
    return { isAuthored: state.authored, stagesJson: '{"second":{"id":"second","layers":[]},"first":{"id":"first","layers":[]}}' };
  } },
  wishService: { getByWeddingId: async () => [], create: vi.fn() },
  photoService: { getCoupleMediaByWeddingId: async () => [], getVisibleByWeddingId: async () => [], upload: vi.fn() },
  eventFeatureService: { isFeatureEnabled: async () => false },
  templateConfigService: { getByWeddingId: async () => ({ 'seating.mode': 'organizer', 't3.layout.mobile.welcome': '{"layers":[{"id":"saved","deleted":true}]}' }) },
  tableService: { getByWeddingId: async () => [] },
  itineraryService: { getByWeddingId: async () => [] },
  guestService: { rsvp: (...args: unknown[]) => state.rsvp(...args) },
}));
import PublicInvite from './page';

beforeEach(() => { state.id = 3; state.authored = false; state.failMetadata = false; vi.clearAllMocks(); });

describe('public shared renderer boundary', () => {
  it.each([3, 15, 16])('routes numbered T%i through the common wrapper without fetching extra metadata', async (id) => {
    state.id = id; render(<PublicInvite />);
    expect(await screen.findByText(`Rendered template ${id}`)).toBeInTheDocument();
    expect(state.metadata).not.toHaveBeenCalled();
    const props = state.rendered.mock.lastCall![0] as TemplateRenderProps;
    expect(props.wedding).toMatchObject({ templateId: id, brideName: 'Alex', groomName: 'Sam' });
    expect(props.customConfig?.['t3.layout.mobile.welcome']).toBe('{"layers":[{"id":"saved","deleted":true}]}');
    expect(props.seatingEnabled).toBe(false);
    await props.onRSVP({ guestName: 'Nadia', email: '', phoneNumber: '', songRequest: '', numberOfAttendees: 1, isAttending: true, brideOrGroomSide: 'Groom', tableId: 4 });
    expect(state.rsvp).toHaveBeenCalledWith(999, expect.objectContaining({ guestSide: 'SECONDARY', tableId: 4 }));
  });

  it('loads custom authored metadata without changing composition order', async () => {
    state.id = 99; state.authored = true; render(<PublicInvite />);
    await screen.findByText('Rendered template 99');
    const props = state.rendered.mock.lastCall![0] as TemplateRenderProps;
    expect(state.metadata).toHaveBeenCalledWith(99);
    expect(Object.keys(JSON.parse(props.wedding.templateStagesJson!))).toEqual(['second', 'first']);
  });

  it('leaves unknown template IDs to the common fallback when metadata is unavailable', async () => {
    state.id = 404; state.failMetadata = true; render(<PublicInvite />);
    await waitFor(() => expect(state.rendered).toHaveBeenCalled());
    expect(state.rendered.mock.lastCall![0].wedding).toMatchObject({ templateId: 404, templateStagesJson: null });
  });
});
