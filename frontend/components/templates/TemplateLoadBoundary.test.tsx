import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import TemplateLoadBoundary, { TemplateLoading } from './TemplateLoadBoundary';

function FailedChunk(): never { throw new Error('Chunk download failed'); }

describe('template loading UI', () => {
  it('shows an accessible loading state without displaying a different template', () => {
    render(<TemplateLoading />);
    expect(screen.getByRole('status', { name: 'Loading invitation' })).toHaveTextContent('Loading invitation…');
  });
  it('keeps successful content intact', () => {
    render(<TemplateLoadBoundary><p>Saved invitation</p></TemplateLoadBoundary>);
    expect(screen.getByText('Saved invitation')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).toBeNull();
  });
  it('shows a retry after a rejected import and recovers on a template-key change', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const retry = vi.fn();
    try {
      const { rerender } = render(<TemplateLoadBoundary key="15" onRetry={retry}><FailedChunk /></TemplateLoadBoundary>);
      expect(screen.getByRole('alert')).toHaveTextContent('This invitation couldn’t load');
      fireEvent.click(screen.getByRole('button', { name: 'Reload preview' }));
      expect(retry).toHaveBeenCalledOnce();
      rerender(<TemplateLoadBoundary key="7"><p>Roman Garden</p></TemplateLoadBoundary>);
      expect(screen.getByText('Roman Garden')).toBeInTheDocument();
      expect(screen.queryByRole('alert')).toBeNull();
    } finally { consoleError.mockRestore(); }
  });
});
