import { createAuthClient } from "better-auth/react";
import { magicLinkClient } from "better-auth/client/plugins";

// In production, don't set baseURL to allow better-auth to use the current origin
// This fixes CORS issues when accessing from different Vercel deployment URLs
export const authClient = createAuthClient({
  baseURL: process.env.NODE_ENV === "development" ? process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000" : undefined,
  plugins: [magicLinkClient()],
});

// Export typed hooks
export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
} = authClient;
