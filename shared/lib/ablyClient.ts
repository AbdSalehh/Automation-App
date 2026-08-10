import * as Ably from "ably";

import { apiClient } from "@/shared/api/apiClient";
import type { ApiResponse } from "@/shared/api/http";

/**
 * Klien Ably bersama (singleton) dengan reference counting. Beberapa store
 * (balasan & sesi) berbagi SATU koneksi WebSocket agar tidak melebihi batas
 * concurrent connection (mis. Ably free tier). Koneksi dibuat saat pemakai
 * pertama memanggil `acquireAblyClient` dan ditutup saat pemakai terakhir
 * memanggil `releaseAblyClient`.
 */
let sharedClient: Ably.Realtime | null = null;

let referenceCount = 0;

/**
 * Mengembalikan klien Ably bersama, membuatnya bila belum ada. Token diambil
 * dari endpoint BFF agar API key tetap aman di server.
 */
export function acquireAblyClient(): Ably.Realtime {
  referenceCount += 1;

  if (sharedClient) {
    return sharedClient;
  }

  sharedClient = new Ably.Realtime({
    authCallback: async (_tokenParams, callback) => {
      try {
        const { data: response } = await apiClient.get<
          ApiResponse<Ably.TokenRequest>
        >("/whatsapp/ably-token");

        callback(null, response.data);
      } catch (error) {
        callback(error as string, null);
      }
    },
  });

  return sharedClient;
}

export async function refreshAblyAuthorization(): Promise<void> {
  if (sharedClient) {
    await sharedClient.auth.authorize();
  }
}

/**
 * Melepas satu referensi koneksi. Saat tidak ada lagi pemakai, koneksi ditutup
 * dan direset agar bisa dibuat ulang ketika dibutuhkan lagi.
 */
export function releaseAblyClient(): void {
  referenceCount = Math.max(0, referenceCount - 1);

  if (referenceCount === 0 && sharedClient) {
    sharedClient.close();
    sharedClient = null;
  }
}
