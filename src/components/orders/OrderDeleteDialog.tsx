import { AlertTriangle, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface OrderDeleteDialogProps {
  open: boolean
  isDeleting: boolean
  orderLabel: string
  onClose: () => void
  onConfirm: () => void
}

export function OrderDeleteDialog({
  open,
  isDeleting,
  orderLabel,
  onClose,
  onConfirm,
}: OrderDeleteDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose()
      }}
    >
      <DialogContent showCloseButton={!isDeleting}>
        <DialogHeader>
          <div className="mb-2 inline-flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="size-6" />
          </div>
          <DialogTitle>Siparişi silmek istediğine emin misin?</DialogTitle>
          <DialogDescription className="pt-1">
            <span className="font-semibold text-foreground">{orderLabel}</span>{' '}
            kalıcı olarak silinecek. Bu işlem geri alınamaz.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Vazgeç
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
            className="gap-2"
          >
            <Trash2 className="size-4" />
            {isDeleting ? 'Siliniyor...' : 'Evet, sil'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
