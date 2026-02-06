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

interface ProductDeleteDialogProps {
  open: boolean
  isDeleting: boolean
  productLabel: string
  onClose: () => void
  onConfirm: () => void
}

export function ProductDeleteDialog({
  open,
  isDeleting,
  productLabel,
  onClose,
  onConfirm,
}: ProductDeleteDialogProps) {
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
          <DialogTitle>Ürünü silmek istediğine emin misin?</DialogTitle>
          <DialogDescription className="pt-1">
            <span className="font-semibold text-foreground">{productLabel}</span>{' '}
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
