import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LinkField } from '../LinkField';

beforeEach(() => vi.unstubAllGlobals());

function renderField() {
  const calls: { url: string; method: string }[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input, init) => {
      const url = String(input);
      calls.push({ url, method: init?.method ?? 'GET' });
      if (url.endsWith('/geofences')) {
        return new Response(
          JSON.stringify([
            { id: 1, name: 'Zone A' },
            { id: 2, name: 'Zone B' },
          ]),
          { status: 200 },
        );
      }
      if (url.includes('/geofences?deviceId=')) {
        return new Response(JSON.stringify([{ id: 1, name: 'Zone A' }]), { status: 200 });
      }
      return new Response(null, { status: 204 });
    }),
  );
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <LinkField
        label="Geofences"
        endpointAll="/geofences"
        endpointLinked="/geofences?deviceId=5"
        baseId={5}
        keyBase="deviceId"
        keyLink="geofenceId"
      />
    </QueryClientProvider>,
  );
  return calls;
}

describe('LinkField', () => {
  it('POSTs a permission when a new option is linked', async () => {
    const calls = renderField();
    await userEvent.click(await screen.findByRole('button', { name: /geofences/i }));
    await userEvent.click(await screen.findByText('Zone B'));
    await waitFor(() =>
      expect(calls.some((c) => c.url.endsWith('/permissions') && c.method === 'POST')).toBe(true),
    );
  });
});
