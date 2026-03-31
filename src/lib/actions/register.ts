'use server';

import { auth } from '@/lib/auth';
import { mergeGuestToUser } from '@/lib/actions/merge';
import { createDefaultNotificationPreferences } from '@/lib/db/queries/users';
import { onUserSignUp } from '@/lib/auth';
import { headers } from 'next/headers';

export interface RegisterResult {
  success: boolean;
  error?: string;
  merged?: boolean;
  userId?: string;
}

/**
 * Register a new user with email and password
 * Integrates guest-to-user merge per AUTH-05 requirement
 *
 * Per CONTEXT.md D-16 through D-18:
 * - Reads guest_token from cookie
 * - Creates user via better-auth
 * - Merges guest data to new account
 * - Creates default notification preferences
 * - Sends welcome email
 *
 * @param email - User email address
 * @param password - User password (min 8 chars)
 * @param name - User display name
 * @returns RegisterResult with success status and merge info
 */
export async function registerAction(
  email: string,
  password: string,
  name: string
): Promise<RegisterResult> {
  try {
    // Create user via better-auth email/password signup
    const result = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
      },
    });

    if (!result?.user?.id) {
      return {
        success: false,
        error: 'Registration failed',
      };
    }

    const userId = result.user.id;

    // Step 1: Merge guest data to new user account (AUTH-05)
    let hasMergedData = false;
    try {
      const mergeResult = await mergeGuestToUser(userId);
      if (!mergeResult.success) {
        console.error('Guest merge failed during registration:', mergeResult.error);
      } else if (
        mergeResult.matchesMerged > 0 ||
        mergeResult.ratingsGivenMerged > 0 ||
        mergeResult.ratingsReceivedMerged > 0
      ) {
        console.log(`Guest merged to user ${userId}:`, {
          matches: mergeResult.matchesMerged,
          ratingsGiven: mergeResult.ratingsGivenMerged,
          ratingsReceived: mergeResult.ratingsReceivedMerged,
        });
        hasMergedData = true;
      }
    } catch (mergeError) {
      // Log but don't fail registration (Rule 2: missing critical functionality)
      console.error('Guest merge error during registration:', mergeError);
    }

    // Step 2: Create default notification preferences
    try {
      await createDefaultNotificationPreferences(userId);
    } catch (prefError) {
      console.error('Failed to create notification preferences:', prefError);
    }

    // Step 3: Send welcome email
    try {
      await onUserSignUp(name, email);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
    }

    return {
      success: true,
      merged: hasMergedData,
      userId,
    };
  } catch (error: any) {
    console.error('Registration error:', error);
    return {
      success: false,
      error: error?.message || String(error),
    };
  }
}

/**
 * Sign in with email and password
 * Does NOT trigger guest merge (only for new accounts)
 */
export async function signInAction(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await auth.api.signInEmail({
      body: {
        email,
        password,
      },
    });

    if (!result) {
      return {
        success: false,
        error: 'Sign in failed',
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Sign in error:', error);
    return {
      success: false,
      error: String(error),
    };
  }
}
