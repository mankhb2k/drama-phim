"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui";
import type { R2FolderItem } from "@/lib/stores/r2-manager-store";

interface DeleteFolderConfirmProps {
  open: boolean;
  folder: R2FolderItem | null;
  onClose: () => void;
  onConfirm: (folder: R2FolderItem) => void;
  isLoading?: boolean;
}

export function DeleteFolderConfirm({
  open,
  folder,
  onClose,
  onConfirm,
  isLoading = false,
}: DeleteFolderConfirmProps) {
  return (
    <AlertDialog open={open} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xóa folder</AlertDialogTitle>
          {folder && (
            <>
              <AlertDialogDescription>
                Bạn có chắc muốn xóa folder <span className="font-medium text-foreground">{folder.name}</span> và toàn bộ nội dung bên trong?
              </AlertDialogDescription>
              <p className="font-mono text-xs text-muted-foreground">{folder.prefix}</p>
            </>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Hủy</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => folder && onConfirm(folder)}
            disabled={!folder || isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? "Đang xóa…" : "Xóa"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
