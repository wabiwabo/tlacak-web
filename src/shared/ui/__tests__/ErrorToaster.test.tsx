import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ErrorToaster } from '../ErrorToaster';
import { useErrorsStore } from '@/shared/lib/errors/errors-store';

beforeEach(() => {
  useErrorsStore.setState({ errors: [] });
});

describe('ErrorToaster', () => {
  it('renders a queued error message and drains the queue', async () => {
    render(<ErrorToaster />);
    act(() => {
      useErrorsStore.getState().push('Server exploded');
    });
    expect(await screen.findByText('Server exploded')).toBeInTheDocument();
    expect(useErrorsStore.getState().errors).toEqual([]);
  });

  it('shortens a Java-style exception message to its first line', async () => {
    render(<ErrorToaster />);
    act(() => {
      useErrorsStore.getState().push('java.lang.RuntimeException: Bad input\n  at line 1');
    });
    expect(await screen.findByText('Bad input')).toBeInTheDocument();
  });

  it('drains multiple queued errors in order', async () => {
    render(<ErrorToaster />);
    act(() => {
      useErrorsStore.getState().push('First error');
      useErrorsStore.getState().push('Second error');
    });
    expect(await screen.findByText('First error')).toBeInTheDocument();
    expect(await screen.findByText('Second error')).toBeInTheDocument();
    expect(useErrorsStore.getState().errors).toEqual([]);
  });
});
