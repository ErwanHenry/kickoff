import { ImageResponse } from "next/og";
import { getMatchForOG } from "@/lib/db/queries/matches";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export const runtime = "edge";

/**
 * OG image generation endpoint for WhatsApp link previews
 * Per plan 10-01 Task 3: SHARE-01, SHARE-02
 *
 * Design decisions from CONTEXT.md:
 * - D-01: Branded card design 1200x630px with kickoff colors
 * - D-02: 3-tier visual hierarchy (title > info > brand)
 * - D-03: 3-4 elements max (title, player count, location, date)
 * - D-04: Player count badge uses lime #4ADE80 background
 * - D-05: Football icon center-left (120px), small icons for date/time
 * - D-06: Use system fonts (Edge compatible) with 52px headings, 36px body
 * - D-07: Fallback title, truncate location after 25 chars
 * - D-08: Use @vercel/og for dynamic image generation
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const matchId = searchParams.get("matchId");

  if (!matchId) {
    return new Response("Missing matchId", { status: 400 });
  }

  const match = await getMatchForOG(matchId);

  if (!match) {
    return new Response("Match not found", { status: 404 });
  }

  // Truncate location after 25 chars (D-07)
  const location =
    match.location.length > 25
      ? `${match.location.slice(0, 25)}...`
      : match.location;

  // Fallback title (D-07): "Match du [date]" if no title
  const title =
    match.title ||
    `Match du ${format(match.date, "dd MMM", { locale: fr })}`;

  // Player count badge (D-04)
  const playerBadge = `${match.confirmedCount}/${match.maxPlayers} confirmés`;

  // Format date/time in French locale
  const dateTime = format(match.date, "EEE d MMM HH'h'mm", { locale: fr });

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#2D5016",
          backgroundImage: "linear-gradient(135deg, #2D5016 0%, #1A3009 100%)",
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        {/* Football icon (D-05) */}
        <div style={{ fontSize: 120, marginBottom: 20 }}>⚽</div>

        {/* Title (D-02: tier 1 - largest) */}
        <div
          style={{
            fontSize: 52,
            fontWeight: 700,
            color: "white",
            textAlign: "center",
            padding: "0 40px",
            marginBottom: 20,
          }}
        >
          {title}
        </div>

        {/* Player count badge (D-04: lime background) */}
        <div
          style={{
            fontSize: 36,
            fontWeight: 600,
            backgroundColor: "#4ADE80",
            color: "#1A3009",
            padding: "12px 32px",
            borderRadius: "20px",
            marginBottom: 40,
          }}
        >
          {playerBadge}
        </div>

        {/* Location (D-02: tier 2 - medium) */}
        <div
          style={{
            fontSize: 24,
            color: "white",
            opacity: 0.9,
            marginBottom: 8,
          }}
        >
          📍 {location}
        </div>

        {/* Date/time (D-02: tier 2 - medium) */}
        <div
          style={{
            fontSize: 24,
            color: "white",
            opacity: 0.9,
          }}
        >
          📅 {dateTime}
        </div>

        {/* Brand (D-02: tier 3 - small, bottom right) */}
        <div
          style={{
            position: "absolute",
            bottom: 40,
            right: 40,
            fontSize: 20,
            color: "rgba(255,255,255,0.6)",
            fontWeight: 600,
          }}
        >
          kickoff
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
