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
  removeCredential: (credentialId: string) => Promise<void>;
  testCredential: (
    payload: CreateCredentialPayload,
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
      set({ errorMessage: "Gagal memuat kredensial." });
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
      set({ errorMessage: "Gagal menyimpan kredensial." });

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

  credentialsByType: (credentialType) =>
    get().credentials.filter(
      (credential) => credential.type === credentialType,
    ),
}));
