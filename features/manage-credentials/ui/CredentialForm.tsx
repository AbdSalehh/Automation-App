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

  /**
   * Google OAuth memakai alur connect-button: user mengisi Client ID & Secret
   * miliknya, lalu diarahkan ke layar izin Google untuk mendapatkan refresh
   * token secara otomatis (tanpa Playground).
   */
  const isGoogleOAuth = credentialType === "google_oauth";

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

  /**
   * Mengarahkan browser ke endpoint authorize. Server akan menyimpan Client ID
   * & Secret sementara di Redis lalu meredirect ke layar izin Google.
   */
  const handleConnectGoogle = () => {
    const params = new URLSearchParams({
      clientId: fieldValues.clientId ?? "",
      clientSecret: fieldValues.clientSecret ?? "",
      name: credentialName,
    });

    window.location.href = `/api/connectors/google/authorize?${params.toString()}`;
  };

  const isGoogleConnectDisabled =
    !credentialName.trim() ||
    !fieldValues.clientId?.trim() ||
    !fieldValues.clientSecret?.trim();

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="text-foreground mb-1 block text-sm font-medium">
          Connector Type
        </label>

        <Select
          value={credentialType}
          onValueChange={(selectedType) => {
            setCredentialType(selectedType as CredentialType);
            setFieldValues({});
            setTestMessage(null);
            setTestError(null);
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

          {credentialField.type === "select" ? (
            <Select
              value={fieldValues[credentialField.key] ?? ""}
              onValueChange={(selectedValue) =>
                updateFieldValue(credentialField.key, selectedValue)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select one" />
              </SelectTrigger>

              <SelectContent>
                {credentialField.options?.map((fieldOption) => (
                  <SelectItem key={fieldOption.value} value={fieldOption.value}>
                    {fieldOption.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              type={credentialField.secret ? "password" : "text"}
              value={fieldValues[credentialField.key] ?? ""}
              placeholder={credentialField.placeholder}
              onChange={(changeEvent) =>
                updateFieldValue(credentialField.key, changeEvent.target.value)
              }
            />
          )}
        </div>
      ))}

      {isGoogleOAuth && (
        <p className="text-muted-foreground text-xs">
          After entering the Client ID & Client Secret, click the button below
          to sign in with Google and grant access. The refresh token will be
          saved automatically, with no OAuth Playground required.
        </p>
      )}

      {testMessage && <p className="text-sm text-emerald-600">{testMessage}</p>}
      {testError && <p className="text-destructive text-sm">{testError}</p>}

      {isGoogleOAuth ? (
        <Button
          type="button"
          disabled={isGoogleConnectDisabled}
          onClick={handleConnectGoogle}
        >
          Connect with Google
        </Button>
      ) : (
        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={isTesting}
            onClick={handleTestConnection}
          >
            {isTesting && <Spinner />}
            Test Connection
          </Button>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Spinner />}
            Save
          </Button>
        </div>
      )}
    </form>
  );
}
