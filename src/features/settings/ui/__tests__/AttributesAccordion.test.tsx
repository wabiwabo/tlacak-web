import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AttributesAccordion } from '../AttributesAccordion';

describe('AttributesAccordion', () => {
  it('edits an existing string attribute', async () => {
    const setAttributes = vi.fn();
    render(<AttributesAccordion attributes={{ color: 'red' }} setAttributes={setAttributes} />);
    await userEvent.click(screen.getByText('Attributes'));
    const input = screen.getByDisplayValue('red');
    await userEvent.type(input, 'X');
    expect(setAttributes).toHaveBeenLastCalledWith({ color: 'redX' });
  });

  it('removes an attribute', async () => {
    const setAttributes = vi.fn();
    render(<AttributesAccordion attributes={{ color: 'red' }} setAttributes={setAttributes} />);
    await userEvent.click(screen.getByText('Attributes'));
    await userEvent.click(screen.getByLabelText('remove color'));
    expect(setAttributes).toHaveBeenCalledWith({});
  });
});
