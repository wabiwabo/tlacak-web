import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Plus } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/shared/ui/accordion';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Checkbox } from '@/shared/ui/checkbox';
import { Field } from '@/shared/ui/Field';
import { AddAttributeDialog } from './AddAttributeDialog';
import type { AttributeDefinitions } from '../lib/attribute-definitions';

type AttributeValue = string | number | boolean;
type Attributes = Record<string, unknown>;

interface AttributesAccordionProps {
  attributes: Attributes;
  setAttributes: (attributes: Attributes) => void;
  definitions?: AttributeDefinitions;
}

/** Attributes managed elsewhere (unit prefs, timezone) are not editable here. */
const EXCLUDED = new Set(['speedUnit', 'distanceUnit', 'altitudeUnit', 'volumeUnit', 'timezone']);

export function AttributesAccordion({
  attributes,
  setAttributes,
  definitions = {},
}: AttributesAccordionProps) {
  const { t } = useTranslation();
  const [dialogOpen, setDialogOpen] = useState(false);

  const update = (key: string, value: AttributeValue) => {
    setAttributes({ ...attributes, [key]: value });
  };

  const remove = (key: string) => {
    const next = { ...attributes };
    delete next[key];
    setAttributes(next);
  };

  const nameOf = (key: string) => {
    const definition = definitions[key];
    return definition ? t(definition.name) : key;
  };

  const entries = Object.keys(attributes)
    .filter((key) => !EXCLUDED.has(key))
    .map((key) => ({ key, value: attributes[key] }));

  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="attributes">
        <AccordionTrigger>{t('sharedAttributes')}</AccordionTrigger>
        <AccordionContent>
          {entries.map(({ key, value }) => {
            if (typeof value === 'boolean') {
              return (
                <div key={key} className="flex items-center justify-between gap-2">
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={value}
                      onCheckedChange={(checked) => update(key, Boolean(checked))}
                    />
                    {nameOf(key)}
                  </label>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => remove(key)}
                    aria-label={`remove ${key}`}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              );
            }
            const isNumber = typeof value === 'number';
            return (
              <div key={key} className="flex items-end gap-2">
                <div className="flex-1">
                  <Field label={nameOf(key)}>
                    {(id) => (
                      <Input
                        id={id}
                        type={isNumber ? 'number' : 'text'}
                        value={String(value ?? '')}
                        onChange={(e) =>
                          update(key, isNumber ? Number(e.target.value) : e.target.value)
                        }
                      />
                    )}
                  </Field>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => remove(key)}
                  aria-label={`remove ${key}`}
                >
                  <X className="size-4" />
                </Button>
              </div>
            );
          })}
          <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="size-4" /> {t('sharedAdd')}
          </Button>
          <AddAttributeDialog
            open={dialogOpen}
            definitions={definitions}
            onResult={(result) => {
              setDialogOpen(false);
              if (result) {
                const initial =
                  result.type === 'number' ? 0 : result.type === 'boolean' ? false : '';
                update(result.key, initial);
              }
            }}
          />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
