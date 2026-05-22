import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SelectField } from '../SelectField';

const data = [
  { id: 1, name: 'Alpha' },
  { id: 2, name: 'Beta' },
];

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe('SelectField', () => {
  it('calls onChange with the chosen key (single select)', async () => {
    const onChange = vi.fn();
    render(<SelectField label="Group" data={data} value={undefined} onChange={onChange} />, {
      wrapper,
    });
    await userEvent.click(screen.getByRole('button', { name: /group/i }));
    await userEvent.click(screen.getByText('Beta'));
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('accumulates keys in multiple mode', async () => {
    const onChange = vi.fn();
    render(<SelectField label="Groups" data={data} value={[1]} onChange={onChange} multiple />, {
      wrapper,
    });
    await userEvent.click(screen.getByRole('button', { name: /groups/i }));
    await userEvent.click(screen.getByText('Beta'));
    expect(onChange).toHaveBeenCalledWith([1, 2]);
  });
});
