import { create } from "zustand";
import { credentialService } from "../service/credential.service";
import type {
  Credential,
  CreateCredentialPayload,
} from "../model/credential.model";

/**
 * Credential store. Per coding rule #6, API calls and loading/error state live
 * here instead of in components.
 */
interface CredentialState {
  credentials: Credential[];
  isLoading: boolean;
  isSubmitting: boolean;
  isTesting: boolean;
  errorMessage: string | null;

  fetchCredentials: () => Promise<void>;
  createCredential: (payload: CreateCredentialPayload) => Promise<boolean>;
  updateCredential: (
    credentialId: string,
    payload: { name?: string; data?: Record<string, string> },
  ) => Promise<boolean>;
  removeCredential: (credentialId: string) => Promise<void>;
  testCredential: (
    payload: CreateCredentialPayload,
  ) => Promise<{ ok: boolean; message: string }>;
  testCredentialById: (
    credentialId: string,
  ) => Promise<{ ok: boolean; message: string }>;
  credentialsByType: (credentialType: string) => Credential[];
}

export const useCredentialStore = create<CredentialState>((set, get) => ({
  credentials: [],
  isLoading: false,
  isSubmitting: false,
  isTesting: false,
  errorMessage: null,

  fetchCredentials: async () => {
    set({ isLoading: true, errorMessage: null });

    try {
      const credentials = await credentialService.list();
      set({ credentials });
    } catch {
      set({ errorMessage: "Failed to load credentials." });
    } finally {
      set({ isLoading: false });
    }
  },

  createCredential: async (payload) => {
    set({ isSubmitting: true, errorMessage: null });

    try {
      const createdCredential = await credentialService.create(payload);
      set((state) => ({
        credentials: [createdCredential, ...state.credentials],
      }));

      return true;
    } catch {
      set({ errorMessage: "Failed to save the credential." });

      return false;
    } finally {
      set({ isSubmitting: false });
    }
  },

  updateCredential: async (credentialId, payload) => {
    set({ isSubmitting: true, errorMessage: null });

    try {
      const updatedCredential = await credentialService.update(
        credentialId,
        payload,
      );

      set((state) => ({
        credentials: state.credentials.map((credential) =>
          credential.id === credentialId ? updatedCredential : credential,
        ),
      }));

      return true;
    } catch {
      set({ errorMessage: "Failed to update the credential." });

      return false;
    } finally {
      set({ isSubmitting: false });
    }
  },

  removeCredential: async (credentialId) => {
    await credentialService.remove(credentialId);
    set((state) => ({
      credentials: state.credentials.filter(
        (credential) => credential.id !== credentialId,
      ),
    }));
  },

  testCredential: async (payload) => {
    set({ isTesting: true });

    try {
      return await credentialService.test(payload);
    } finally {
      set({ isTesting: false });
    }
  },

  testCredentialById: async (credentialId) => {
    set({ isTesting: true });

    try {
      return await credentialService.testById(credentialId);
    } finally {
      set({ isTesting: false });
    }
  },

  credentialsByType: (credentialType) =>
    get().credentials.filter(
      (credential) => credential.type === credentialType,
    ),
}));
