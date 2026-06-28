"use client";

import { useState } from "react";
import { Button, Input, Modal, Spinner, toast } from "@/shared/ui";
import {
  CREDENTIAL_TYPE_LABELS,
  type CredentialType,
} from "@/shared/config/constants";
import {
  CREDENTIAL_FIELDS,
  useCredentialStore,
  type Credential,
} from "@/entities/credential";

interface CredentialEditDialogProps {
  credential: Credential;
  open: boolean;
  onClose: () => void;
}

/**
 * Dialog edit kredensial. Field rahasia dibiarkan kosong dan hanya menimpa
 * nilai lama bila diisi, sehingga pengguna bisa mengganti nama saja tanpa
 * mengetik ulang seluruh token.
 */
export function CredentialEditDialog({
  credential,
  open,
  onClose,
}: CredentialEditDialogProps) {
  const { updateCredential, isSubmitting } = useCredentialStore();

  const [credentialName, setCredentialName] = useState(credential.name);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});

  const credentialFields = CREDENTIAL_FIELDS[credential.type] ?? [];

  const updateFieldValue = (fieldKey: string, fieldValue: string) =>
    setFieldValues((currentValues) => ({
      ...currentValues,
      [fieldKey]: fieldValue,
    }));

  const handleSubmit = async (submitEvent: React.FormEvent) => {
    submitEvent.preventDefault();

    const wasUpdated = await updateCredential(credential.id, {
      name: credentialName,
      data: fieldValues,
    });

    if (wasUpdated) {
      toast.success("Credential successfully updated.");
      setFieldValues({});
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Edit ${CREDENTIAL_TYPE_LABELS[credential.type as CredentialType]}`}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-foreground mb-1 block text-sm font-medium">
            Credential Name
          </label>

          <Input
            value={credentialName}
            onChange={(changeEvent) =>
              setCredentialName(changeEvent.target.value)
            }
            placeholder="e.g. My Google Workspace"
            required
          />
        </div>

        {credentialFields.map((credentialField) => (
          <div key={credentialField.key}>
            <label className="text-foreground mb-1 block text-sm font-medium">
              {credentialField.label}
            </label>

            <Input
              type={credentialField.secret ? "password" : "text"}
              value={fieldValues[credentialField.key] ?? ""}
              placeholder={
                credentialField.secret
                  ? "Leave blank to keep the existing value"
                  : credentialField.placeholder
              }
              onChange={(changeEvent) =>
                updateFieldValue(credentialField.key, changeEvent.target.value)
              }
            />
          </div>
        ))}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Spinner />}
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}
