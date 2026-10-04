import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

const handlers = toNextJsHandler(auth.handler);

// TEMPORARY diagnostic wrapper (audit 2026-10-04): surface the real auth
// runtime error in the response body. Remove once the prod 500 is fixed.
async function withDiagnostics(
  req: Request
): Promise<Response> {
  const method = req.method === "GET" ? handlers.GET : handlers.POST;
  try {
    return await method(req);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? (error.stack ?? "") : "";
    console.error("[auth-diagnostic]", message, stack);
    return new Response(
      JSON.stringify({ diagnostic: true, message, stack }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
}

export const GET = withDiagnostics;
export const POST = withDiagnostics;
