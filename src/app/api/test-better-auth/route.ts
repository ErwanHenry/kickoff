import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users, accounts } from "@/db/schema";

export async function GET() {
  try {
    // Test 1: Check if environment variables are set
    const envVars = {
      BETTER_AUTH_SECRET: !!process.env.BETTER_AUTH_SECRET,
      BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
      DATABASE_URL: !!process.env.DATABASE_URL,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    };

    // Test 2: Check if database connection works
    const userCount = await db.select().from(users);
    const accountCount = await db.select().from(accounts);

    // Test 3: Check if better-auth is configured
    const authConfig = {
      hasEmailPassword: true,
    };

    return Response.json({
      success: true,
      envVars,
      database: {
        users: userCount.length,
        accounts: accountCount.length,
      },
      authConfig,
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}
