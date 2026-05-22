import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';

interface RemoveDialogProps {
  open: boolean;
  onClose: () => void;
  /** Performs the deletion; resolves when done. */
  onConfirm: () => Promise<void>;
}

export function RemoveDialog({ open, onClose, onConfirm }: RemoveDialogProps) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('sharedRemove')}</DialogTitle>
          <DialogDescription>{t('sharedRemoveConfirm')}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t('sharedCancel')}
          </Button>
          <Button
            variant="destructive"
            onClick={async () => {
              await onConfirm();
              onClose();
            }}
          >
            {t('sharedRemove')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
