// @vitest-environment node
/**
 * Integration test for the createMatch → rsvpMatch flow (regression test for
 * the latent NOT NULL violation on matches.id / match_players.id).
 *
 * Root cause of the bug: the id columns of `matches` and `match_players` have
 * no default (neither in src/db/schema.ts nor in migrations 0000→0009), but
 * createMatch and rsvpMatch inserted without providing an id → PostgreSQL
 * error 23502 (NOT NULL violation) on any database created from the migrations.
 * The fix generates ids explicitly with crypto.randomUUID() (same pattern as
 * createGroup).
 *
 * This test runs the real server actions against an in-memory Postgres
 * (PGlite) with tables pushed from src/db/schema.ts — which has no id
 * defaults, so an insert without an explicit id fails loudly here.
 */
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { pushSchema } from "drizzle-kit/api";
import * as schema from "@/db/schema";

type Db = ReturnType<typeof drizzle<typeof schema>>;

let client: PGlite;
let db: Db;

const ORGANIZER_ID = "00000000-0000-4000-8000-000000000001";

// Mock the Neon connection with PGlite before importing the actions
vi.mock("@/db", () => ({
  get db() {
    return db;
  },
}));

// Mock the authenticated session used by createMatch
vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: async () => ({
        user: { id: ORGANIZER_ID, name: "Organizer" },
      }),
    },
  },
}));

vi.mock("next/headers", () => ({
  headers: async () => new Headers(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: () => {},
}));

vi.mock("@/lib/cookies", () => ({
  setGuestToken: async () => {},
}));

// Imported after the mocks so they bind to the mocked @/db
const { createMatch } = await import("@/app/api/matches/actions");
const { rsvpMatch } = await import("@/lib/actions/rsvp");

beforeAll(async () => {
  client = new PGlite();
  db = drizzle(client, { schema });

  // Create the tables in PGlite directly from src/db/schema.ts (source of truth)
  const { apply } = await pushSchema(schema, db as never);
  await apply();

  // The organizer must exist: matches.created_by has a FK to users
  await db.insert(schema.users).values({
    id: ORGANIZER_ID,
    name: "Organizer",
    email: "organizer@example.com",
  });
}, 60_000);

afterAll(async () => {
  await client?.close();
});

describe("createMatch → rsvpMatch flow (id generation)", () => {
  it("creates a match without a NOT NULL violation on matches.id", async () => {
    const match = await createMatch({
      title: "Foot du mardi",
      location: "UrbanSoccer Nice",
      date: new Date("2026-10-13T19:00:00Z"),
      maxPlayers: 6, // schema minimum, small so the flow can fill the match quickly
      minPlayers: 4,
      recurrence: "none",
    });
    if (!match || "error" in match) throw new Error("createMatch failed");

    expect(match).toBeTruthy();
    expect(match.id).toBeTruthy();
    expect(match.shareToken).toHaveLength(10);
    expect(match.status).toBe("draft");

    const rows = await db.select().from(schema.matches);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.id).toBe(match.id);
  });

  it("confirms a guest RSVP without a NOT NULL violation on match_players.id", async () => {
    const [match] = await db.select().from(schema.matches);
    if (!match) throw new Error("match row missing");

    const result = await rsvpMatch(buildFormData(match.shareToken, "Karim"));

    expect(result).toMatchObject({ success: true, status: "confirmed" });
    expect(result.guestToken).toHaveLength(10);

    const players = await db.select().from(schema.matchPlayers);
    expect(players).toHaveLength(1);
    expect(players[0]?.id).toBeTruthy();
    expect(players[0]?.guestName).toBe("Karim");
  });

  it("fills the match then waitlists the next guests with promotion-ready state", async () => {
    const [match] = await db.select().from(schema.matches);
    if (!match) throw new Error("match row missing");

    // maxPlayers 6: 5 remaining spots, then waitlist
    const guestNames = ["Lucas", "Mehdi", "Antoine", "Youssef", "Théo"];
    for (const guestName of guestNames) {
      const result = await rsvpMatch(buildFormData(match.shareToken, guestName));
      expect(result).toMatchObject({ success: true, status: "confirmed" });
    }

    // Match should now be "full" (WAIT-04)
    const [afterFull] = await db.select().from(schema.matches);
    if (!afterFull) throw new Error("match row missing");
    expect(afterFull.status).toBe("full");

    const seventh = await rsvpMatch(buildFormData(match.shareToken, "Romain"));
    expect(seventh).toMatchObject({ success: true, status: "waitlisted" });
    expect(seventh.waitlistPosition).toBeGreaterThan(0);

    const players = await db.select().from(schema.matchPlayers);
    expect(players).toHaveLength(7);
    // Every row got a real id
    for (const player of players) {
      expect(player.id).toBeTruthy();
    }
  });
});

function buildFormData(shareToken: string, guestName: string): FormData {
  const formData = new FormData();
  formData.set("shareToken", shareToken);
  formData.set("guestName", guestName);
  return formData;
}
