import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Field } from '@/shared/ui/Field';
import { attributeTypeOptions } from '../lib/options';
import type { AttributeDefinitions, AttributeDefinition } from '../lib/attribute-definitions';

interface AddAttributeDialogProps {
  open: boolean;
  definitions: AttributeDefinitions;
  onResult: (result: { key: string; type: AttributeDefinition['type'] } | null) => void;
}

export function AddAttributeDialog({ open, definitions, onResult }: AddAttributeDialogProps) {
  const { t } = useTranslation();
  const [key, setKey] = useState('');
  const [type, setType] = useState<AttributeDefinition['type']>('string');

  const known = definitions[key];
  const effectiveType = known ? known.type : type;

  const confirm = () => {
    if (!key) {
      return;
    }
    onResult({ key, type: effectiveType });
    setKey('');
    setType('string');
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onResult(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('sharedAdd')}</DialogTitle>
        </DialogHeader>
        <Field label={t('sharedAttribute')}>
          {(id) => <Input id={id} value={key} onChange={(e) => setKey(e.target.value)} />}
        </Field>
        <Field label={t('sharedType')}>
          {(id) => (
            <Select
              value={effectiveType}
              onValueChange={(value) => setType(value as AttributeDefinition['type'])}
              disabled={Boolean(known)}
            >
              <SelectTrigger id={id}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {attributeTypeOptions.map((option) => (
                  <SelectItem key={option.key} value={option.key}>
                    {t(option.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </Field>
        <DialogFooter>
          <Button variant="outline" onClick={() => onResult(null)}>
            {t('sharedCancel')}
          </Button>
          <Button onClick={confirm} disabled={!key}>
            {t('sharedAdd')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
