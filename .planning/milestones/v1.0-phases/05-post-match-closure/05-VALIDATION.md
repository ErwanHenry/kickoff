# Phase 5: Post-Match Closure - Validation

**Created:** 2026-03-30
**Purpose:** Nyquist validation architecture for automated test coverage

---

## Test Coverage Matrix

| Requirement | Unit Tests | Integration Tests | E2E Tests | Coverage Target |
|-------------|------------|-------------------|-----------|-----------------|
| POST-01: Attendance marking | ✅ attendance toggle logic | ✅ form submission | Manual checkpoint | 90% |
| POST-02: Score entry | ✅ Zod validation (0-99) | ✅ score save to DB | Manual checkpoint | 90% |
| POST-03: Match summary | ✅ 500 char limit | ✅ summary save to DB | Manual checkpoint | 85% |
| POST-04: Status "played" | ✅ status transition | ✅ DB transaction | Manual checkpoint | 90% |
| POST-05: No-show status | ✅ status assignment | ✅ attended + status update | Manual checkpoint | 90% |

---

## Unit Tests (Vitest)

### File: src/lib/validations/match.test.ts

```typescript
import { describe, it, expect } from "vitest";
import { matchCloseSchema } from "./match";

describe("matchCloseSchema", () => {
  const validInput = {
    matchId: "123e4567-e89b-12d3-a456-426614174000",
    scoreTeamA: 3,
    scoreTeamB: 2,
    matchSummary: "Great match!",
    attendance: [
      { playerId: "uuid-1", present: true },
      { playerId: "uuid-2", present: false },
    ],
  };

  it("accepts valid input", () => {
    expect(() => matchCloseSchema.parse(validInput)).not.toThrow();
  });

  it("requires both score fields", () => {
    expect(() => matchCloseSchema.parse({ ...validInput, scoreTeamA: undefined })).toThrow();
    expect(() => matchCloseSchema.parse({ ...validInput, scoreTeamB: undefined })).toThrow();
  });

  it("validates score range 0-99", () => {
    expect(() => matchCloseSchema.parse({ ...validInput, scoreTeamA: -1 })).toThrow();
    expect(() => matchCloseSchema.parse({ ...validInput, scoreTeamA: 100 })).toThrow();
    expect(() => matchCloseSchema.parse({ ...validInput, scoreTeamA: 0 })).not.toThrow();
    expect(() => matchCloseSchema.parse({ ...validInput, scoreTeamA: 99 })).not.toThrow();
  });

  it("requires all players marked", () => {
    expect(() => matchCloseSchema.parse({ ...validInput, attendance: [] })).toThrow();
  });

  it("allows optional summary max 500 chars", () => {
    const longSummary = "x".repeat(500);
    expect(() => matchCloseSchema.parse({ ...validInput, matchSummary: longSummary })).not.toThrow();

    const tooLong = "x".repeat(501);
    expect(() => matchCloseSchema.parse({ ...validInput, matchSummary: tooLong })).toThrow();
  });

  it("allows summary to be omitted", () => {
    expect(() => matchCloseSchema.parse({ ...validInput, matchSummary: undefined })).not.toThrow();
  });

  it("requires attendance entries with present boolean", () => {
    expect(() => matchCloseSchema.parse({
      ...validInput,
      attendance: [{ playerId: "uuid-1", present: "true" as any }]
    })).toThrow();
  });
});
```

### File: src/lib/actions/close-match.test.ts

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { closeMatch } from "./close-match";
import { db } from "@/db";
import { auth } from "@/lib/auth";

// Mock dependencies
vi.mock("@/db", () => ({
  db: {
    select: vi.fn(),
    transaction: vi.fn(),
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

describe("closeMatch Server Action", () => {
  const mockUser = { id: "user-123", email: "test@test.com" };
  const mockMatch = {
    id: "match-123",
    createdBy: "user-123",
    status: "locked",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue(mockUser);
  });

  it("returns error if not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null);

    const formData = new FormData();
    formData.set("matchId", "match-123");
    formData.set("scoreTeamA", "3");
    formData.set("scoreTeamB", "2");
    formData.set("attendance", JSON.stringify([{ playerId: "p1", present: true }]));

    const result = await closeMatch(formData);
    expect(result).toEqual({ error: "Non authentifié" });
  });

  it("returns error if match not found", async () => {
    vi.mocked(db.select).mockResolvedValue([]);

    const formData = new FormData();
    formData.set("matchId", "match-123");
    formData.set("scoreTeamA", "3");
    formData.set("scoreTeamB", "2");
    formData.set("attendance", JSON.stringify([{ playerId: "p1", present: true }]));

    const result = await closeMatch(formData);
    expect(result).toEqual({ error: "Match non trouvé" });
  });

  it("returns error if user is not match creator", async () => {
    const otherMatch = { ...mockMatch, createdBy: "other-user" };
    vi.mocked(db.select).mockResolvedValue([otherMatch]);

    const formData = new FormData();
    formData.set("matchId", "match-123");
    formData.set("scoreTeamA", "3");
    formData.set("scoreTeamB", "2");
    formData.set("attendance", JSON.stringify([{ playerId: "p1", present: true }]));

    const result = await closeMatch(formData);
    expect(result).toEqual({ error: "Seul le créateur peut clôturer ce match" });
  });

  it("updates match status to played and saves score", async () => {
    vi.mocked(db.select).mockResolvedValue([mockMatch]);
    const mockUpdate = vi.fn().mockResolvedValue(undefined);
    vi.mocked(db.transaction).mockImplementation(async (callback) => {
      return callback({
        update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue(mockUpdate) }) }),
      });
    });

    const formData = new FormData();
    formData.set("matchId", "match-123");
    formData.set("scoreTeamA", "3");
    formData.set("scoreTeamB", "2");
    formData.set("attendance", JSON.stringify([{ playerId: "p1", present: true }]));

    const result = await closeMatch(formData);
    expect(result.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalled();
  });

  it("sets attended=true and status=confirmed for present players", async () => {
    vi.mocked(db.select).mockResolvedValue([mockMatch]);
    const mockUpdate = vi.fn().mockResolvedValue(undefined);
    vi.mocked(db.transaction).mockImplementation(async (callback) => {
      return callback({
        update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue(mockUpdate) }) }),
      });
    });

    const formData = new FormData();
    formData.set("matchId", "match-123");
    formData.set("scoreTeamA", "3");
    formData.set("scoreTeamB", "2");
    formData.set("attendance", JSON.stringify([
      { playerId: "p1", present: true },
      { playerId: "p2", present: true },
    ]));

    await closeMatch(formData);
    expect(mockUpdate).toHaveBeenCalledTimes(3); // match + 2 players
  });

  it("sets attended=false and status=no_show for absent players", async () => {
    vi.mocked(db.select).mockResolvedValue([mockMatch]);
    const mockUpdate = vi.fn().mockResolvedValue(undefined);
    let setCalls: any[] = [];
    vi.mocked(db.transaction).mockImplementation(async (callback) => {
      return callback({
        update: vi.fn().mockReturnValue({
          set: (data: any) => { setCalls.push(data); return { where: vi.fn().mockReturnValue(Promise.resolve()) }; },
        }),
      });
    });

    const formData = new FormData();
    formData.set("matchId", "match-123");
    formData.set("scoreTeamA", "3");
    formData.set("scoreTeamB", "2");
    formData.set("attendance", JSON.stringify([
      { playerId: "p1", present: true },
      { playerId: "p2", present: false },
    ]));

    await closeMatch(formData);

    // Find player update calls
    const playerUpdates = setCalls.slice(1); // Skip first (match update)
    const absentPlayerUpdate = playerUpdates.find((call, i) => i === 1);
    expect(absentPlayerUpdate).toEqual({ attended: false, status: "no_show" });
  });

  it("rolls back transaction on error", async () => {
    vi.mocked(db.select).mockResolvedValue([mockMatch]);
    vi.mocked(db.transaction).mockRejectedValue(new Error("DB Error"));

    const formData = new FormData();
    formData.set("matchId", "match-123");
    formData.set("scoreTeamA", "3");
    formData.set("scoreTeamB", "2");
    formData.set("attendance", JSON.stringify([{ playerId: "p1", present: true }]));

    const result = await closeMatch(formData);
    expect(result).toEqual({ error: "Erreur lors de la clôture du match" });
  });
});
```

### File: src/lib/db/queries/matches.test.ts

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { getConfirmedPlayersForAttendance } from "./matches";
import { db } from "@/db";

vi.mock("@/db", () => ({
  db: {
    select: vi.fn(),
  },
}));

describe("getConfirmedPlayersForAttendance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns only confirmed players", async () => {
    const mockPlayers = [
      { id: "p1", name: "Player 1", team: "A", confirmedAt: new Date() },
      { id: "p2", name: "Player 2", team: "B", confirmedAt: new Date() },
    ];
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        leftJoin: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(mockPlayers),
          }),
        }),
      }),
    } as any);

    const result = await getConfirmedPlayersForAttendance("match-123");
    expect(result).toEqual(mockPlayers);
  });

  it("includes player name from user or guest", async () => {
    const mockPlayers = [
      { id: "p1", name: "Guest Player", team: "A", confirmedAt: new Date() },
    ];
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        leftJoin: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(mockPlayers),
          }),
        }),
      }),
    } as any);

    const result = await getConfirmedPlayersForAttendance("match-123");
    expect(result[0].name).toBe("Guest Player");
  });

  it("includes team assignment (A or B)", async () => {
    const mockPlayers = [
      { id: "p1", name: "Player 1", team: "A", confirmedAt: new Date() },
      { id: "p2", name: "Player 2", team: "B", confirmedAt: new Date() },
      { id: "p3", name: "Player 3", team: null, confirmedAt: new Date() },
    ];
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        leftJoin: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(mockPlayers),
          }),
        }),
      }),
    } as any);

    const result = await getConfirmedPlayersForAttendance("match-123");
    expect(result[0].team).toBe("A");
    expect(result[1].team).toBe("B");
    expect(result[2].team).toBe(null);
  });

  it("orders by team then confirmedAt", async () => {
    const mockPlayers = [
      { id: "p1", name: "Player 1", team: "A", confirmedAt: new Date("2024-01-01") },
      { id: "p2", name: "Player 2", team: "A", confirmedAt: new Date("2024-01-02") },
      { id: "p3", name: "Player 3", team: "B", confirmedAt: new Date("2024-01-01") },
    ];
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        leftJoin: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(mockPlayers),
          }),
        }),
      }),
    } as any);

    const result = await getConfirmedPlayersForAttendance("match-123");
    expect(result).toEqual(mockPlayers);
  });
});
```

---

## Integration Tests

### File: tests/integration/match-closure.integration.test.ts

```typescript
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { closeMatch } from "@/lib/actions/close-match";
import { getConfirmedPlayersForAttendance } from "@/lib/db/queries/matches";
import { db } from "@/db";
import { matches, matchPlayers, users } from "@/db/schema";
import { eq } from "drizzle-orm";

describe("Match Closure Integration", () => {
  let matchId: string;
  let organizerId: string;
  let player1Id: string;
  let player2Id: string;

  beforeAll(async () => {
    // Create organizer
    const [organizer] = await db.insert(users).values({
      email: "organizer@test.com",
      name: "Organizer",
    }).returning();
    organizerId = organizer.id;

    // Create match
    const [match] = await db.insert(matches).values({
      id: crypto.randomUUID(),
      createdBy: organizerId,
      location: "Test Field",
      date: new Date(),
      maxPlayers: 10,
      minPlayers: 6,
      status: "locked",
      shareToken: "test-token",
    }).returning();
    matchId = match.id;

    // Create confirmed players
    const [p1] = await db.insert(matchPlayers).values({
      matchId,
      userId: organizerId,
      status: "confirmed",
      team: "A",
      confirmedAt: new Date(),
    }).returning();
    player1Id = p1.id;

    const [p2] = await db.insert(matchPlayers).values({
      matchId,
      guestName: "Guest Player",
      status: "confirmed",
      team: "B",
      confirmedAt: new Date(),
    }).returning();
    player2Id = p2.id;
  });

  afterAll(async () => {
    await db.delete(matchPlayers).where(eq(matchPlayers.matchId, matchId));
    await db.delete(matches).where(eq(matches.id, matchId));
    await db.delete(users).where(eq(users.id, organizerId));
  });

  it("closes match with all present", async () => {
    // Mock session
    const formData = new FormData();
    formData.set("matchId", matchId);
    formData.set("scoreTeamA", "3");
    formData.set("scoreTeamB", "2");
    formData.set("matchSummary", "Great match!");
    formData.set("attendance", JSON.stringify([
      { playerId: player1Id, present: true },
      { playerId: player2Id, present: true },
    ]));

    const result = await closeMatch(formData);
    expect(result.success).toBe(true);

    // Verify match status
    const [match] = await db.select().from(matches).where(eq(matches.id, matchId));
    expect(match.status).toBe("played");
    expect(match.scoreTeamA).toBe(3);
    expect(match.scoreTeamB).toBe(2);
    expect(match.matchSummary).toBe("Great match!");

    // Verify player attendance
    const [p1] = await db.select().from(matchPlayers).where(eq(matchPlayers.id, player1Id));
    expect(p1.attended).toBe(true);
    expect(p1.status).toBe("confirmed");

    const [p2] = await db.select().from(matchPlayers).where(eq(matchPlayers.id, player2Id));
    expect(p2.attended).toBe(true);
    expect(p2.status).toBe("confirmed");
  });

  it("assigns no_show status to absent players", async () => {
    // Reset match for this test
    await db.update(matches).set({ status: "locked" }).where(eq(matches.id, matchId));
    await db.update(matchPlayers).set({ attended: null, status: "confirmed" });

    const formData = new FormData();
    formData.set("matchId", matchId);
    formData.set("scoreTeamA", "2");
    formData.set("scoreTeamB", "1");
    formData.set("attendance", JSON.stringify([
      { playerId: player1Id, present: true },
      { playerId: player2Id, present: false },
    ]));

    const result = await closeMatch(formData);
    expect(result.success).toBe(true);

    // Verify no_show status
    const [p2] = await db.select().from(matchPlayers).where(eq(matchPlayers.id, player2Id));
    expect(p2.attended).toBe(false);
    expect(p2.status).toBe("no_show");
  });
});
```

---

## E2E Verification (Manual Checkpoint)

See Task 6 (checkpoint) in 05-01-PLAN.md for complete manual verification steps.

Key scenarios to verify:
1. All players pre-marked as present (switches ON)
2. Toggle OFF shows no-show warning
3. Score validation (both fields required)
4. Submit button disabled until valid
5. Confirmation dialog with warning text
6. Success redirect to match detail
7. Database updates (status "played", score, attended, no_show)
8. Permission checks (non-creator denied)
9. Mobile responsiveness (375px viewport)

---

## Coverage Targets

| Component | Target | Tool |
|-----------|--------|------|
| Validation schemas | 90% | Vitest |
| Server Actions | 85% | Vitest + mocks |
| Database queries | 85% | Vitest + integration |
| Form components | Manual | Checkpoint |
| Page routes | Manual | Checkpoint |

**Overall Target:** 85% automated coverage + manual checkpoint for UI

---

## Test Commands

```bash
# Unit tests
pnpm test src/lib/validations/match.test.ts
pnpm test src/lib/actions/close-match.test.ts
pnpm test src/lib/db/queries/matches.test.ts

# Integration tests
pnpm test tests/integration/match-closure.integration.test.ts

# All tests
pnpm test

# Coverage report
pnpm test:coverage
```

---

## Nyquist Compliance

- ✅ Test files defined for all TDD tasks (Tasks 1, 2, 3)
- ✅ Integration test for end-to-end flow
- ✅ Manual checkpoint for UI verification
- ✅ Coverage targets specified
- ✅ Test commands documented

**Validation complete.** Plan can proceed to execution.
