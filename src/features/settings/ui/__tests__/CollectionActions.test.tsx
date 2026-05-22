import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { CollectionActions } from '../CollectionActions';

describe('CollectionActions', () => {
  it('confirms before removing an item', async () => {
    const remove = vi.fn().mockResolvedValue(undefined);
    render(
      <MemoryRouter>
        <CollectionActions itemId={3} editPath="/settings/device" remove={remove} />
      </MemoryRouter>,
    );
    await userEvent.click(screen.getByLabelText('Remove'));
    const dialog = screen.getByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Remove' }));
    expect(remove).toHaveBeenCalledWith(3);
  });

  it('hides edit and remove when readonly', () => {
    render(
      <MemoryRouter>
        <CollectionActions itemId={3} editPath="/settings/device" remove={vi.fn()} readonly />
      </MemoryRouter>,
    );
    expect(screen.queryByLabelText('Edit')).not.toBeInTheDocument();
  });
});
