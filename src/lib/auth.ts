import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { magicLink } from "better-auth/plugins";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { Resend } from "resend";
import { sendWelcomeEmail } from "@/lib/utils/emails";

export const resend = new Resend(process.env.RESEND_API_KEY);

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.users,
      // better-auth will create its own session/account tables
    },
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    // Password requirements
    minPasswordLength: 8,
  },
  session: {
    // Default session duration: 7 days
    expiresIn: 60 * 60 * 24 * 7,
    // Refresh session if older than 1 day
    updateAge: 60 * 60 * 24,
    // Extended session for "remember me": 30 days
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes client cache
    },
  },
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        await resend.emails.send({
          from: process.env.EMAIL_FROM || "noreply@kickoff.app",
          to: email,
          subject: "Connexion a kickoff",
          html: `
            <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #2D5016;">kickoff</h2>
              <p>Clique sur ce lien pour te connecter :</p>
              <a href="${url}" style="display: inline-block; background: #2D5016; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">
                Se connecter
              </a>
              <p style="color: #666; font-size: 14px;">Ce lien expire dans 5 minutes.</p>
            </div>
          `,
        });
      },
      expiresIn: 300, // 5 minutes
    }),
  ],
  // Allow any origin for Vercel deployments (preview + production)
  // Use a function to dynamically get the origin from the request
  trustedOrigins: async (request) => {
    // In development, only allow localhost
    if (process.env.NODE_ENV === "development") {
      return ["http://localhost:3000"];
    }
    // In production, allow the current request origin
    if (request?.url) {
      const url = new URL(request.url);
      return [url.origin];
    }
    // Fallback: return null to allow all origins
    return [null];
  },
  hooks: {
    after: [
      {
        matcher(context) {
          return context.context?.action === "signUp";
        },
        handler: async (ctx) => {
          // Send welcome email after user registration
          // Per plan 10-02 Task 8: Integrate welcome email into registration flow
          const user = ctx.context?.user;
          if (user?.name && user?.email) {
            try {
              await sendWelcomeEmail(user.name, user.email);
            } catch (emailError) {
              // Log but don't fail registration
              console.error('Failed to send welcome email:', emailError);
            }
          }
        },
      },
    ],
  },
});

// Type exports
export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
