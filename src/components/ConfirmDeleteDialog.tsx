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

interface ConfirmDeleteDialogProps {
  open: boolean
  isDeleting: boolean
  title: string
  itemLabel: string
  description: string
  cancelLabel: string
  confirmLabel: string
  confirmingLabel: string
  onClose: () => void
  onConfirm: () => void
}

export function ConfirmDeleteDialog({
  open,
  isDeleting,
  title,
  itemLabel,
  description,
  cancelLabel,
  confirmLabel,
  confirmingLabel,
  onClose,
  onConfirm,
}: ConfirmDeleteDialogProps) {
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
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="pt-1">
            <span className="font-semibold text-foreground">{itemLabel}</span>{' '}
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            {cancelLabel}
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
            className="gap-2"
          >
            <Trash2 className="size-4" />
            {isDeleting ? confirmingLabel : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
