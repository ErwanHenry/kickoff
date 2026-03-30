import { cookies } from "next/headers";

const GUEST_COOKIE_NAME = "kickoff_guest_token";

/**
 * Set the guest token cookie with 30-day expiration (per GUEST-03)
 * Uses httpOnly for security, sameSite=lax for mobile compatibility
 */
export async function setGuestToken(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(GUEST_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days per GUEST-03
    path: "/",
  });
}

/**
 * Get the guest token from cookies
 * Returns undefined if not set (first-time visitor)
 */
export async function getGuestToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(GUEST_COOKIE_NAME)?.value;
}

/**
 * Delete the guest token cookie
 * Called when guest wants to clear their identity (rare)
 */
export async function deleteGuestToken(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(GUEST_COOKIE_NAME);
}
