"use client";

import { useState } from "react";
import {
  MoreHorizontalIcon,
  KeyRoundIcon,
  Trash2Icon,
  EyeIcon,
  EyeOffIcon,
  CheckCircle2Icon,
  XCircleIcon,
  LockOpenIcon,
  UserXIcon,
  UserCheckIcon,
} from "lucide-react";
import { Button, Input } from "@/shared/ui";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/shared/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/shared/ui/alert-dialog";
import { useManagedUserStore } from "@/entities/managed-user";
import type { ManagedUser } from "@/entities/managed-user";
import { toast } from "@/shared/ui";

interface UserRowActionsProps {
  user: ManagedUser;
}

const MIN_PASSWORD_LENGTH = 8;

/**
 * Aksi per baris user: popover berisi Setujui/Tolak (untuk akun pending), Buka
 * Kunci (untuk akun terkunci), Reset Password (dialog), dan Hapus (alert-dialog
 * konfirmasi). State submit dikelola di store.
 */
export function UserRowActions({ user }: UserRowActionsProps) {
  const {
    isSubmitting,
    resetPassword,
    approveUser,
    rejectUser,
    unlockUser,
    setUserActive,
    removeUser,
  } = useManagedUserStore();

  const [isResetOpen, setIsResetOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const isPending = user.approvalStatus === "pending";
  const isRejected = user.approvalStatus === "rejected";

  const handleResetPassword = async () => {
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setLocalError(
        `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
      );
      return;
    }

    setLocalError(null);

    const success = await resetPassword(user.id, newPassword);

    if (success) {
      toast.success(`Password for ${user.email} was successfully reset.`);
      setNewPassword("");
      setIsResetOpen(false);
    } else {
      toast.error("Failed to reset the password.");
    }
  };

  const handleApprove = async () => {
    const success = await approveUser(user.id);

    if (success) {
      toast.success(`User ${user.email} has been approved.`);
    } else {
      toast.error("Failed to approve the user.");
    }
  };

  const handleReject = async () => {
    const success = await rejectUser(user.id);

    if (success) {
      toast.success(`User ${user.email} has been rejected.`);
    } else {
      toast.error("Failed to reject the user.");
    }
  };

  const handleUnlock = async () => {
    const success = await unlockUser(user.id);

    if (success) {
      toast.success(`${user.email} has been unlocked.`);
    } else {
      toast.error("Failed to unlock the user.");
    }
  };

  const handleDeactivate = async () => {
    const success = await setUserActive(user.id, false);

    if (success) {
      toast.success(`User ${user.email} has been deactivated.`);
      setIsDeactivateOpen(false);
    } else {
      toast.error("Failed to deactivate the user.");
    }
  };

  const handleActivate = async () => {
    const success = await setUserActive(user.id, true);

    if (success) {
      toast.success(`User ${user.email} has been activated.`);
    } else {
      toast.error("Failed to activate the user.");
    }
  };

  const handleDelete = async () => {
    const success = await removeUser(user.id);

    if (success) {
      toast.success(`User ${user.email} was successfully deleted.`);
    } else {
      toast.error("Failed to delete the user.");
    }
  };

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8">
            <MoreHorizontalIcon className="size-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-48 p-1.5">
          {(isPending || isRejected) && (
            <button
              type="button"
              onClick={handleApprove}
              disabled={isSubmitting}
              className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm text-emerald-600 transition-colors hover:bg-emerald-50 disabled:opacity-50"
            >
              <CheckCircle2Icon className="size-4" />
              Approve
            </button>
          )}

          {isPending && (
            <button
              type="button"
              onClick={handleReject}
              disabled={isSubmitting}
              className="text-destructive hover:bg-destructive/10 flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm transition-colors disabled:opacity-50"
            >
              <XCircleIcon className="size-4" />
              Reject
            </button>
          )}

          {user.isLocked && (
            <button
              type="button"
              onClick={handleUnlock}
              disabled={isSubmitting}
              className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm text-amber-600 transition-colors hover:bg-amber-50 disabled:opacity-50"
            >
              <LockOpenIcon className="size-4" />
              Unlock
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsResetOpen(true)}
            className="hover:bg-accent flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm transition-colors"
          >
            <KeyRoundIcon className="size-4" />
            Reset Password
          </button>

          {user.isActive ? (
            <button
              type="button"
              onClick={() => setIsDeactivateOpen(true)}
              className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm text-amber-600 transition-colors hover:bg-amber-50"
            >
              <UserXIcon className="size-4" />
              Deactivate
            </button>
          ) : (
            <button
              type="button"
              onClick={handleActivate}
              disabled={isSubmitting}
              className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm text-emerald-600 transition-colors hover:bg-emerald-50 disabled:opacity-50"
            >
              <UserCheckIcon className="size-4" />
              Activate
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsDeleteOpen(true)}
            className="text-destructive hover:bg-destructive/10 flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm transition-colors"
          >
            <Trash2Icon className="size-4" />
            Delete
          </button>
        </PopoverContent>
      </Popover>

      {/* Dialog reset password */}
      <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Set a new password for{" "}
              <span className="text-foreground font-medium">{user.email}</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2 py-2">
            <label className="text-foreground text-sm font-medium">
              New Password
            </label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(changeEvent) =>
                  setNewPassword(changeEvent.target.value)
                }
                placeholder="At least 8 characters"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((previous) => !previous)}
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
              >
                {showPassword ? (
                  <EyeOffIcon className="size-4" />
                ) : (
                  <EyeIcon className="size-4" />
                )}
              </button>
            </div>

            {localError && (
              <p className="text-destructive text-xs">{localError}</p>
            )}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleResetPassword} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Reset Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Konfirmasi nonaktifkan */}
      <AlertDialog open={isDeactivateOpen} onOpenChange={setIsDeactivateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate User?</AlertDialogTitle>
            <AlertDialogDescription>
              The account{" "}
              <span className="text-foreground font-medium">{user.email}</span>{" "}
              will not be able to sign in and any active sessions will be signed
              out automatically. You can reactivate it at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDeactivate}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Processing..." : "Deactivate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Konfirmasi hapus */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User?</AlertDialogTitle>
            <AlertDialogDescription>
              This action is permanent. The account{" "}
              <span className="text-foreground font-medium">{user.email}</span>{" "}
              along with all related data will be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
