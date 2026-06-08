"use client";

import { useState } from "react";
import {
  Button,
  Input,
  Spinner,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui";
import {
  CREDENTIAL_TYPES,
  CREDENTIAL_TYPE_LABELS,
  type CredentialType,
} from "@/shared/config/constants";
import { CREDENTIAL_FIELDS, useCredentialStore } from "@/entities/credential";

interface CredentialFormProps {
  onCreated?: () => void;
}

export function CredentialForm({ onCreated }: CredentialFormProps) {
  const { createCredential, testCredential, isSubmitting, isTesting } =
    useCredentialStore();

  const [credentialType, setCredentialType] =
    useState<CredentialType>("whatsapp");
  const [credentialName, setCredentialName] = useState("");
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [testMessage, setTestMessage] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  const credentialFields = CREDENTIAL_FIELDS[credentialType];

  const updateFieldValue = (fieldKey: string, fieldValue: string) =>
    setFieldValues((currentValues) => ({
      ...currentValues,
      [fieldKey]: fieldValue,
    }));

  const handleTestConnection = async () => {
    setTestMessage(null);
    setTestError(null);

    const testResult = await testCredential({
      type: credentialType,
      name: credentialName || "test",
      data: fieldValues,
    });

    if (testResult.ok) {
      setTestMessage(testResult.message);
    } else {
      setTestError(testResult.message);
    }
  };

  const handleSubmit = async (submitEvent: React.FormEvent) => {
    submitEvent.preventDefault();

    const wasCreated = await createCredential({
      type: credentialType,
      name: credentialName,
      data: fieldValues,
    });

    if (wasCreated) {
      setCredentialName("");
      setFieldValues({});
      setTestMessage(null);
      setTestError(null);
      onCreated?.();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">
          Tipe Konektor
        </label>

        <Select
          value={credentialType}
          onValueChange={(selectedType) => {
            setCredentialType(selectedType as CredentialType);
            setFieldValues({});
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>

          <SelectContent>
            {CREDENTIAL_TYPES.map((connectorType) => (
              <SelectItem key={connectorType} value={connectorType}>
                {CREDENTIAL_TYPE_LABELS[connectorType]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">
          Nama Kredensial
        </label>

        <Input
          value={credentialName}
          onChange={(changeEvent) =>
            setCredentialName(changeEvent.target.value)
          }
          placeholder="mis. WA Produksi"
          required
        />
      </div>

      {credentialFields.map((credentialField) => (
        <div key={credentialField.key}>
          <label className="mb-1 block text-sm font-medium text-foreground">
            {credentialField.label}
          </label>

          <Input
            type={credentialField.secret ? "password" : "text"}
            value={fieldValues[credentialField.key] ?? ""}
            placeholder={credentialField.placeholder}
            onChange={(changeEvent) =>
              updateFieldValue(credentialField.key, changeEvent.target.value)
            }
          />
        </div>
      ))}

      {testMessage && <p className="text-sm text-emerald-600">{testMessage}</p>}
      {testError && <p className="text-sm text-destructive">{testError}</p>}

      <div className="flex gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={isTesting}
          onClick={handleTestConnection}
        >
          {isTesting && <Spinner />}
          Uji Koneksi
        </Button>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Spinner />}
          Simpan
        </Button>
      </div>
    </form>
  );
}
