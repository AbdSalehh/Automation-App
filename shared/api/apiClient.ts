import axios from "axios";

/**
 * Centralised Axios instance for talking to the app's own Next.js route
 * handlers. Auth is handled by NextAuth session cookies, so we send
 * credentials with every request and let the server read the session.
 *
 * Per coding rule #5, all HTTP requests must go through this instance rather
 * than the native fetch API or ad-hoc axios calls.
 */
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "/api",
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
  withCredentials: true,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      // Session expired or missing. Components decide how to react.
    }

    return Promise.reject(error);
  },
);
