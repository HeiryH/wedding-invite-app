import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import PersonalisePage from './page';

const { router, getActive, getTemplateDefault, selfRegister } = vi.hoisted(() => ({
  router: { push: vi.fn(), replace: vi.fn() },
  getActive: vi.fn(),
  getTemplateDefault: vi.fn(),
  selfRegister: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => router,
  useSearchParams: () => new URLSearchParams('template=7&event=WEDDING'),
}));
vi.mock('@/lib/api', () => ({
  templateService: { getActive },
  templateConfigService: { getTemplateDefault },
  authService: { selfRegister },
}));

describe('public template trial', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    getActive.mockResolvedValue([{ templateId: 7, templateName: 'Roman Garden' }]);
    getTemplateDefault.mockResolvedValue({});
  });
  afterEach(cleanup);

  it('publishes edited schedule entries and leaves untouched examples in the preview', async () => {
    selfRegister.mockResolvedValue({ email: 'test@example.com' });
    render(<PersonalisePage />);
    await screen.findByTitle('Invitation preview');
    fireEvent.change(screen.getByLabelText('Schedule item 1'), { target: { value: 'Doors open' } });
    fireEvent.change(screen.getByLabelText('RSVP layout'), { target: { value: 'inline' } });
    fireEvent.click(screen.getByRole('button', { name: 'Show email' }));
    expect(screen.getByText('Your details').closest('details')).toHaveAttribute('open');
    fireEvent.click(screen.getByText('Seating', { selector: 'summary' }));
    expect(screen.getByText('Your details').closest('details')).not.toHaveAttribute('open');
    expect(screen.getAllByLabelText('Table name').map((input) => (input as HTMLInputElement).value))
      .toEqual(['Family', 'Relatives', 'Friends']);
    fireEvent.change(screen.getByLabelText('Table name', { selector: 'input[value="Family"]' }), { target: { value: 'Family table' } });
    fireEvent.change(screen.getAllByLabelText('Guest capacity')[0], { target: { value: '12' } });
    fireEvent.click(screen.getByRole('button', { name: /Publish invite/ }));
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'test-password' } });
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'test-password' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create free account' }));

    await waitFor(() => expect(selfRegister).toHaveBeenCalledWith(expect.objectContaining({
      itinerary: [{ label: 'Doors open', detail: '10:00 AM', sortOrder: 0 }],
      config: { 'rsvp.form_layout': 'inline', 'rsvp.fields.email': 'false' },
      tables: [{ tableName: 'Family table', capacity: 12 }],
    })));
  });

  it.each([null, 'SUPER_ADMIN', 'HOST_ADMIN', 'ORGANIZER_ADMIN'])(
    'keeps the selected template editable with cached role %s',
    async (role) => {
      if (role) localStorage.setItem('user', JSON.stringify({ email: 'test@example.com', role }));
      render(<PersonalisePage />);

      await screen.findByText(/Roman Garden · Live preview/);
      expect(router.push).not.toHaveBeenCalled();
      expect(router.replace).not.toHaveBeenCalled();
      expect(screen.getByTitle('Invitation preview')).toHaveAttribute('src', '/organizer-admin/preview?trial=1');

      fireEvent.change(screen.getByLabelText("Bride's name"), { target: { value: 'Nadia' } });
      await waitFor(() => {
        const draft = JSON.parse(localStorage.getItem('personalise_draft_v1')!);
        expect(draft.templateId).toBe(7);
        expect(draft.wedding.brideName).toBe('Nadia');
      });
      expect(router.replace).not.toHaveBeenCalled();
    },
  );

  it('previews the published layout while preserving guest edits from an older draft', async () => {
    localStorage.setItem('personalise_draft_v1', JSON.stringify({
      templateId: 7, event: 'WEDDING', itinerary: [],
      wedding: { brideName: 'Nadia', groomName: 'Hariz', weddingDate: '2027-06-01', venue: 'Garden' },
      config: { 'invite.body': 'Join us in the garden', 'invite.body.align': 'center' },
    }));
    getTemplateDefault.mockResolvedValue({
      'invite.body.align': 'left',
      't7.layout.mobile.welcome': '{"bgPosition":"top"}',
      'walimah.body': '<p>&nbsp;<br></p>',
    });
    render(<PersonalisePage />);

    const iframe = await screen.findByTitle<HTMLIFrameElement>('Invitation preview');
    const frameWindow = iframe.contentWindow!;
    const postMessage = vi.spyOn(frameWindow, 'postMessage');
    fireEvent(window, new MessageEvent('message', {
      origin: window.location.origin,
      source: frameWindow,
      data: { type: 'PREVIEW_READY' },
    }));

    await waitFor(() => expect(postMessage).toHaveBeenCalledWith({
      type: 'PREVIEW_UPDATE',
      payload: expect.objectContaining({
        customConfig: {
          'invite.body': 'Join us in the garden',
          'invite.body.align': 'left',
          't7.layout.mobile.welcome': '{"bgPosition":"top"}',
          'walimah.body': '<p>Join us for our wedding ceremony, followed by a meal and photos with family and friends.</p>',
        },
      }),
    }, window.location.origin));
    expect(getTemplateDefault).toHaveBeenCalledWith(7);
    expect(JSON.parse(localStorage.getItem('personalise_draft_v1')!).config).toEqual({
      'invite.body': 'Join us in the garden',
    });
  });
});
