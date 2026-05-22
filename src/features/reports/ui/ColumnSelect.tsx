import { useTranslation } from 'react-i18next';
import { Field } from '@/shared/ui/Field';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/checkbox';

/** A selectable report column: `key` is the field, `labelKey` its translation key. */
export interface ReportColumnOption {
  key: string;
  labelKey: string;
}

interface ColumnSelectProps {
  options: ReportColumnOption[];
  visible: string[];
  setVisible: (columns: string[]) => void;
}

export function ColumnSelect({ options, visible, setVisible }: ColumnSelectProps) {
  const { t } = useTranslation();

  const toggle = (key: string) => {
    setVisible(visible.includes(key) ? visible.filter((k) => k !== key) : [...visible, key]);
  };

  return (
    <div className="min-w-40">
      <Field label={t('sharedColumns')}>
        {(id) => (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id={id}
                type="button"
                variant="outline"
                className="w-full justify-start font-normal"
              >
                {visible.length} / {options.length}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="p-1">
              <ul className="max-h-72 overflow-y-auto">
                {options.map((option) => (
                  <li key={option.key}>
                    <label className="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-muted">
                      <Checkbox
                        checked={visible.includes(option.key)}
                        onCheckedChange={() => toggle(option.key)}
                      />
                      {t(option.labelKey)}
                    </label>
                  </li>
                ))}
              </ul>
            </PopoverContent>
          </Popover>
        )}
      </Field>
    </div>
  );
}
