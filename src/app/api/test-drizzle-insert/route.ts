import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, accounts } from "@/db/schema";
import { nanoid } from "nanoid";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    console.log("[DRIZZLE_TEST] Attempting direct Drizzle insert...");

    // Create user
    const userId = nanoid();
    await db.insert(users).values({
      id: userId,
      email,
      name,
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log("[DRIZZLE_TEST] User created with ID:", userId);

    // Create account
    // better-auth uses userId as accountId for email/password provider
    const providerId = "credential";

    await db.insert(accounts).values({
      accountId: userId, // This is what better-auth uses as account_id
      providerId,
      userId,
      password, // In real code, this would be hashed
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log("[DRIZZLE_TEST] Account created for user:", userId);

    return NextResponse.json({
      status: "ok",
      userId,
      accountId,
    });
  } catch (error) {
    console.error("[DRIZZLE_TEST] Error:", error);
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
