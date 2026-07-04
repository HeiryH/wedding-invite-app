import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders its children', () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('is disabled while loading and does not fire onClick', () => {
    const onClick = vi.fn();
    render(<Button loading onClick={onClick}>Submit</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    btn.click();
    expect(onClick).not.toHaveBeenCalled();
  });

  it('fires onClick when enabled', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Go</Button>);
    screen.getByRole('button', { name: 'Go' }).click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
