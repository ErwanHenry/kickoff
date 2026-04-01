import { NextResponse } from "next/server";
import { db } from "@/db";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    // Test 1: Database connection
    console.log("[TEST_DB] Testing database connection...");
    const result = await db.execute("SELECT 1 as test");
    console.log("[TEST_DB] Database query result:", result);

    // Test 2: Check if better-auth is configured
    console.log("[TEST_DB] Testing better-auth config...");
    const authConfig = auth.$Infer;
    console.log("[TEST_DB] Auth config loaded");

    // Test 3: Check environment variables (without exposing secrets)
    const envCheck = {
      DATABASE_URL: process.env.DATABASE_URL ? "SET" : "MISSING",
      BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET ? "SET" : "MISSING",
      BETTER_AUTH_URL: process.env.BETTER_AUTH_URL ? "SET" : "MISSING",
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ? "SET" : "MISSING",
      RESEND_API_KEY: process.env.RESEND_API_KEY ? "SET" : "MISSING",
      NODE_ENV: process.env.NODE_ENV || "undefined",
    };

    return NextResponse.json({
      status: "ok",
      database: "connected",
      auth: "configured",
      env: envCheck,
    });
  } catch (error) {
    console.error("[TEST_DB] Error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
