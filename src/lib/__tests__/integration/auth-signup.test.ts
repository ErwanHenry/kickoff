// @vitest-environment node
/**
 * Integration test for the better-auth signup flow (regression test for the
 * production 500 on POST /api/auth/sign-up/email).
 *
 * Root cause of the bug: the Drizzle schema for the better-auth tables did not
 * match what better-auth v1.5 requires (`account.id` primary key missing,
 * `session.createdAt/updatedAt` missing, no `verification` table). The drizzle
 * adapter then throws a BetterAuthError ("The field 'id' does not exist in the
 * 'account' Drizzle schema") which surfaces as a 500 with no body.
 *
 * This test runs the real better-auth + drizzle adapter + the app schema
 * against an in-memory Postgres (PGlite), mirroring the adapter configuration
 * of src/lib/auth.ts (email/password + autoSignIn + magic link).
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { pushSchema } from "drizzle-kit/api";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { magicLink } from "better-auth/plugins";
import * as schema from "@/db/schema";

type Db = ReturnType<typeof drizzle<typeof schema>>;

const sentMagicLinks: string[] = [];

// Mirrors the adapter/emailAndPassword configuration of src/lib/auth.ts
function makeAuth(database: Db) {
  return betterAuth({
    baseURL: "http://localhost:3000",
    secret: "test-secret-for-vitest-0123456789abcdef",
    database: drizzleAdapter(database, {
      provider: "pg",
      schema: {
        user: schema.users,
        session: schema.sessions,
        account: schema.accounts,
        verification: schema.verifications,
      },
    }),
    emailAndPassword: {
      enabled: true,
      autoSignIn: true,
      minPasswordLength: 8,
    },
    plugins: [
      magicLink({
        sendMagicLink: async ({ url }) => {
          sentMagicLinks.push(url);
        },
        expiresIn: 300,
      }),
    ],
  });
}

let client: PGlite;
let db: Db;
let auth: ReturnType<typeof makeAuth>;

beforeAll(async () => {
  client = new PGlite();
  db = drizzle(client, { schema });

  // Create the tables in PGlite directly from src/db/schema.ts (source of truth)
  const { apply } = await pushSchema(schema, db as never);
  await apply();

  auth = makeAuth(db);
}, 60_000);

afterAll(async () => {
  await client?.close();
});

describe("better-auth signup (email/password)", () => {
  const email = "fresh-user@example.com";
  const password = "test12345";

  it("creates user + credential account + session without a 500", async () => {
    const result = await auth.api.signUpEmail({
      body: { name: "Fresh User", email, password },
    });

    expect(result.user).toBeDefined();
    expect(result.user.email).toBe(email);
    // autoSignIn: true must return a session token
    expect(result.token).toBeTruthy();

    // The user row exists
    const users = await db.select().from(schema.users);
    expect(users).toHaveLength(1);
    expect(users[0]?.id).toBe(result.user.id);

    // The credential account row exists, with its own id (better-auth requirement)
    const accounts = await db.select().from(schema.accounts);
    expect(accounts).toHaveLength(1);
    expect(accounts[0]?.id).toBeTruthy();
    expect(accounts[0]?.providerId).toBe("credential");
    expect(accounts[0]?.userId).toBe(result.user.id);
    expect(accounts[0]?.password).toBeTruthy();

    // autoSignIn created a session row (requires session.createdAt/updatedAt)
    const sessions = await db.select().from(schema.sessions);
    expect(sessions).toHaveLength(1);
    expect(sessions[0]?.userId).toBe(result.user.id);
  });

  it("rejects a duplicate email with USER_ALREADY_EXISTS (422), not a 500", async () => {
    await expect(
      auth.api.signUpEmail({
        body: { name: "Dup User", email, password },
      })
    ).rejects.toMatchObject({ status: "UNPROCESSABLE_ENTITY" });
  });

  it("allows signing in with the created credentials", async () => {
    const result = await auth.api.signInEmail({
      body: { email, password },
    });
    expect(result.user.email).toBe(email);
    expect(result.token).toBeTruthy();
  });
});

describe("better-auth magic link", () => {
  it("stores the token in the verification table", async () => {
    await auth.api.signInMagicLink({
      body: { email: "magic@example.com" },
      headers: new Headers(),
    });

    expect(sentMagicLinks).toHaveLength(1);
    const rows = await db.select().from(schema.verifications);
    expect(rows.length).toBeGreaterThanOrEqual(1);
  });
});
