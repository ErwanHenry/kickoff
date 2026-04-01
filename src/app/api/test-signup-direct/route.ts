import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

// Wrap the handler to catch errors
const wrappedHandler = async (request: Request) => {
  try {
    console.log("[TEST SIGNUP] Request received:", request.url);
    console.log("[TEST SIGNUP] Method:", request.method);
    console.log("[TEST SIGNUP] Headers:", Object.fromEntries(request.headers.entries()));

    const handler = toNextJsHandler(auth);
    const response = await handler.POST(request);

    console.log("[TEST SIGNUP] Response status:", response.status);
    console.log("[TEST SIGNUP] Response headers:", Object.fromEntries(response.headers.entries()));

    // Clone response to read body
    const clonedResponse = response.clone();
    const body = await clonedResponse.text();
    console.log("[TEST SIGNUP] Response body:", body);

    return response;
  } catch (error) {
    console.error("[TEST SIGNUP] Error:", error);
    console.error("[TEST SIGNUP] Error stack:", error instanceof Error ? error.stack : "No stack");
    console.error("[TEST SIGNUP] Error name:", error instanceof Error ? error.name : "Unknown");
    console.error("[TEST SIGNUP] Error message:", error instanceof Error ? error.message : "Unknown");

    return new Response(
      JSON.stringify({
        error: "Test signup error",
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : "Unknown",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

export const POST = wrappedHandler;
