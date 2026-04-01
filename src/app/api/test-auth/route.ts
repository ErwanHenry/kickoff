import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    console.log("[TEST_AUTH] Attempting signup for:", email);
    console.log("[TEST_AUTH] Request body:", { email, name, passwordLength: password?.length });

    // Test better-auth signup directly
    const result = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
      },
    });

    console.log("[TEST_AUTH] Signup result:", result);

    return NextResponse.json({
      status: "ok",
      result,
    });
  } catch (error) {
    console.error("[TEST_AUTH] Error:", error);
    console.error("[TEST_AUTH] Error name:", error instanceof Error ? error.name : "Unknown");
    console.error("[TEST_AUTH] Error message:", error instanceof Error ? error.message : "No message");

    // Try to extract the underlying database error
    const err = error as any;
    console.error("[TEST_AUTH] Full error object:", JSON.stringify(err, null, 2));

    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined,
        cause: err.cause,
        code: err.code,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Test if auth handler is working
    console.log("[TEST_AUTH] Testing auth configuration...");

    const configInfo = {
      hasEmailPassword: true, // We know this is enabled
      hasMagicLink: true, // We know this is enabled
      baseURL: process.env.NEXT_PUBLIC_APP_URL || "not set",
      betterAuthURL: process.env.BETTER_AUTH_URL || "not set",
      nodeEnv: process.env.NODE_ENV || "not set",
    };

    return NextResponse.json({
      status: "ok",
      config: configInfo,
    });
  } catch (error) {
    console.error("[TEST_AUTH] Error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
