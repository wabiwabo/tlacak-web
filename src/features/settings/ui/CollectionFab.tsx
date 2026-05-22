import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { Button } from '@/shared/ui/button';

interface CollectionFabProps {
  /** Create-route, e.g. `/settings/device`. */
  editPath: string;
  disabled?: boolean;
}

export function CollectionFab({ editPath, disabled = false }: CollectionFabProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  if (disabled) {
    return null;
  }
  return (
    <Button
      type="button"
      onClick={() => navigate(editPath)}
      aria-label={t('sharedAdd')}
      className="fixed bottom-6 end-6 size-12 rounded-full shadow-lg"
    >
      <Plus className="size-5" />
    </Button>
  );
}
