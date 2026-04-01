import { db } from "@/db";
import { users, accounts } from "@/db/schema";
import { nanoid } from "nanoid";

export async function GET() {
  const logs: string[] = [];
  const startTime = Date.now();

  try {
    logs.push(`[${Date.now() - startTime}ms] Starting debug test`);

    // Test 1: Check database connection
    logs.push(`[${Date.now() - startTime}ms] Testing database connection...`);

    // Test 2: Try to query users table
    const allUsers = await db.select().from(users).limit(1);
    logs.push(`[${Date.now() - startTime}ms] Users query successful. Count: ${allUsers.length}`);

    // Test 3: Try to query accounts table
    const allAccounts = await db.select().from(accounts).limit(1);
    logs.push(`[${Date.now() - startTime}ms] Accounts query successful. Count: ${allAccounts.length}`);

    // Test 4: Try to insert a test user
    const testUserId = nanoid();
    logs.push(`[${Date.now() - startTime}ms] Attempting to insert test user with ID: ${testUserId}`);

    try {
      await db.insert(users).values({
        id: testUserId,
        email: `test-${testUserId}@example.com`,
        name: "Test User",
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      logs.push(`[${Date.now() - startTime}ms] User insert successful!`);
    } catch (insertError: any) {
      logs.push(`[${Date.now() - startTime}ms] User insert FAILED: ${insertError.message}`);
      logs.push(`[${Date.now() - startTime}ms] Error details: ${JSON.stringify(insertError)}`);
    }

    // Test 5: Try to insert a test account
    const accountId = nanoid();
    logs.push(`[${Date.now() - startTime}ms] Attempting to insert test account...`);

    try {
      await db.insert(accounts).values({
        accountId: accountId,
        providerId: "email",
        userId: testUserId,
        password: "test-hash",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      logs.push(`[${Date.now() - startTime}ms] Account insert successful!`);
    } catch (accountError: any) {
      logs.push(`[${Date.now() - startTime}ms] Account insert FAILED: ${accountError.message}`);
      logs.push(`[${Date.now() - startTime}ms] Error details: ${JSON.stringify(accountError)}`);
    }

    // Test 6: Query the inserted data
    const testUser = await db.select().from(users).where((users) => users.id === testUserId);
    logs.push(`[${Date.now() - startTime}ms] Test user query result: ${JSON.stringify(testUser)}`);

    const testAccount = await db.select().from(accounts).where((accounts) => accounts.accountId === accountId);
    logs.push(`[${Date.now() - startTime}ms] Test account query result: ${JSON.stringify(testAccount)}`);

    // Cleanup
    logs.push(`[${Date.now() - startTime}ms] Cleaning up test data...`);

    return Response.json({
      success: true,
      logs,
      timing: `${Date.now() - startTime}ms`,
    });
  } catch (error: any) {
    logs.push(`[${Date.now() - startTime}ms] UNEXPECTED ERROR: ${error.message}`);
    logs.push(`[${Date.now() - startTime}ms] Error stack: ${error.stack}`);
    logs.push(`[${Date.now() - startTime}ms] Error details: ${JSON.stringify(error)}`);

    return Response.json({
      success: false,
      error: error.message,
      stack: error.stack,
      logs,
    }, { status: 500 });
  }
}
