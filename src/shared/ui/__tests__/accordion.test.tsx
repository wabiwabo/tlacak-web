import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '../accordion';

describe('Accordion', () => {
  it('reveals content when the trigger is clicked', async () => {
    render(
      <Accordion type="single" collapsible>
        <AccordionItem value="a">
          <AccordionTrigger>Section</AccordionTrigger>
          <AccordionContent>Body text</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );
    expect(screen.queryByText('Body text')).not.toBeInTheDocument();
    await userEvent.click(screen.getByText('Section'));
    expect(screen.getByText('Body text')).toBeVisible();
  });
});
