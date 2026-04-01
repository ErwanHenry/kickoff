import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

// Wrap the handler to add error logging
const handler = toNextJsHandler(auth.handler);

export const GET = async (request: Request) => {
  try {
    console.log("[AUTH] GET request:", request.url);
    return await handler.GET(request);
  } catch (error) {
    console.error("[AUTH] GET error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

export const POST = async (request: Request) => {
  try {
    console.log("[AUTH] POST request:", request.url);
    const response = await handler.POST(request);
    console.log("[AUTH] POST response status:", response.status);
    return response;
  } catch (error) {
    console.error("[AUTH] POST error:", error);
    console.error("[AUTH] Error stack:", error instanceof Error ? error.stack : "No stack trace");
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
