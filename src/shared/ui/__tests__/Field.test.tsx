import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Field } from '../Field';

describe('Field', () => {
  it('wires the label to the control via a generated id', () => {
    render(<Field label="Name">{(id) => <input id={id} aria-label="control" />}</Field>);
    const input = screen.getByLabelText('control');
    expect(screen.getByText('Name')).toHaveAttribute('for', input.id);
  });

  it('renders an error message with role alert', () => {
    render(
      <Field label="Name" error="Required">
        {(id) => <input id={id} />}
      </Field>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Required');
  });
});
