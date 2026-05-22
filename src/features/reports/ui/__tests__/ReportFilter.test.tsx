import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { ReportFilter } from '../ReportFilter';

function wrap(children: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify([]), { status: 200 })),
  );
});

describe('ReportFilter', () => {
  it('disables Show until a device is selected (multiple mode)', () => {
    render(wrap(<ReportFilter deviceType="multiple" onShow={vi.fn()} />));
    expect(screen.getByRole('button', { name: /show/i })).toBeDisabled();
  });

  it('enables Show with no device in date-only (none) mode and calls onShow', async () => {
    const onShow = vi.fn();
    render(wrap(<ReportFilter deviceType="none" onShow={onShow} />));
    const show = screen.getByRole('button', { name: /show/i });
    expect(show).toBeEnabled();
    await userEvent.click(show);
    expect(onShow).toHaveBeenCalledOnce();
    expect(onShow.mock.calls[0]?.[0]).toMatchObject({ deviceIds: [], groupIds: [] });
  });
});
