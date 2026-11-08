import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import PersonalisePage from './page';

const { router, getActive } = vi.hoisted(() => ({
  router: { push: vi.fn(), replace: vi.fn() },
  getActive: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => router,
  useSearchParams: () => new URLSearchParams('template=7&event=WEDDING'),
}));
vi.mock('@/lib/api', () => ({
  templateService: { getActive },
  authService: { selfRegister: vi.fn() },
}));

describe('public template trial', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    getActive.mockResolvedValue([{ templateId: 7, templateName: 'Roman Garden' }]);
  });
  afterEach(cleanup);

  it.each([null, 'SUPER_ADMIN', 'HOST_ADMIN', 'ORGANIZER_ADMIN'])(
    'keeps the selected template editable with cached role %s',
    async (role) => {
      if (role) localStorage.setItem('user', JSON.stringify({ email: 'test@example.com', role }));
      render(<PersonalisePage />);

      await screen.findByText(/Roman Garden · Live preview/);
      expect(router.push).not.toHaveBeenCalled();
      expect(router.replace).not.toHaveBeenCalled();
      expect(screen.getByTitle('Invitation preview')).toHaveAttribute('src', '/organizer-admin/preview');

      fireEvent.change(screen.getByLabelText("Bride's name"), { target: { value: 'Nadia' } });
      await waitFor(() => {
        const draft = JSON.parse(localStorage.getItem('personalise_draft_v1')!);
        expect(draft.templateId).toBe(7);
        expect(draft.wedding.brideName).toBe('Nadia');
      });
      expect(router.replace).not.toHaveBeenCalled();
    },
  );
});
