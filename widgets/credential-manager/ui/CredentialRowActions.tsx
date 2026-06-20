"use client";

import { useState } from "react";
import {
  MoreVerticalIcon,
  PencilIcon,
  EyeIcon,
  Trash2Icon,
  PlugZapIcon,
} from "lucide-react";
import { Button, Spinner, toast } from "@/shared/ui";
import { Popover, PopoverTrigger, PopoverContent } from "@/shared/ui/popover";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/shared/ui/alert-dialog";
import { cn } from "@/shared/lib/utils";
import { useCredentialStore, type Credential } from "@/entities/credential";
import { CredentialEditDialog } from "./CredentialEditDialog";
import { CredentialDetailDialog } from "./CredentialDetailDialog";

interface CredentialRowActionsProps {
  credential: Credential;
}

interface ActionItemProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
}

/** Satu item menu di dalam popover aksi. */
function ActionItem({
  icon,
  label,
  onClick,
  disabled,
  destructive,
}: ActionItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "hover:bg-accent flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        destructive
          ? "text-destructive hover:bg-destructive/10"
          : "text-foreground",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

/**
 * Menu aksi kredensial berbasis popover: Tes Koneksi, Edit, Detail, dan Hapus.
 * Edit & Detail membuka dialog (Modal), sedangkan Hapus memunculkan konfirmasi
 * AlertDialog agar tidak terhapus tanpa sengaja.
 */
export function CredentialRowActions({
  credential,
}: CredentialRowActionsProps) {
  const { removeCredential, testCredentialById, isTesting } =
    useCredentialStore();

  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleTestConnection = async () => {
    setIsPopoverOpen(false);

    const testResult = await testCredentialById(credential.id);

    if (testResult.ok) {
      toast.success(testResult.message);
    } else {
      toast.error(testResult.message);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      await removeCredential(credential.id);
      toast.success("Kredensial berhasil dihapus.");
      setIsDeleteOpen(false);
    } catch {
      toast.error("Gagal menghapus kredensial.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex items-center justify-end gap-1.5">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleTestConnection}
        disabled={isTesting}
        className="gap-1.5"
      >
        {isTesting ? <Spinner /> : <PlugZapIcon className="size-4" />}
        Tes Koneksi
      </Button>

      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="text-muted-foreground hover:bg-accent hover:text-foreground grid size-8 place-items-center rounded-md"
            aria-label={`Aksi untuk ${credential.name}`}
          >
            <MoreVerticalIcon className="size-4" />
          </button>
        </PopoverTrigger>

        <PopoverContent align="end" className="w-44 p-1.5">
          <ActionItem
            icon={<PencilIcon className="size-4" />}
            label="Edit"
            onClick={() => {
              setIsPopoverOpen(false);
              setIsEditOpen(true);
            }}
          />
          <ActionItem
            icon={<EyeIcon className="size-4" />}
            label="Detail"
            onClick={() => {
              setIsPopoverOpen(false);
              setIsDetailOpen(true);
            }}
          />
          <ActionItem
            icon={<Trash2Icon className="size-4" />}
            label="Hapus"
            destructive
            onClick={() => {
              setIsPopoverOpen(false);
              setIsDeleteOpen(true);
            }}
          />
        </PopoverContent>
      </Popover>

      <CredentialEditDialog
        credential={credential}
        open={isEditOpen}
        onClose={() => setIsEditOpen(false)}
      />

      <CredentialDetailDialog
        credential={credential}
        open={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
      />

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus kredensial ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Kredensial &quot;{credential.name}&quot; akan dihapus permanen.
              Workflow yang memakainya bisa berhenti bekerja. Tindakan ini tidak
              dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={(clickEvent) => {
                clickEvent.preventDefault();
                handleDelete();
              }}
              disabled={isDeleting}
            >
              {isDeleting && <Spinner />}
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
