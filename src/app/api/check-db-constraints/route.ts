import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'DATABASE_URL not set' }, { status: 500 });
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    // Check account table structure
    const accountInfo = await sql`
      SELECT
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'account'
      ORDER BY ordinal_position
    `;

    // Check constraints
    const constraints = await sql`
      SELECT
        conname AS constraint_name,
        contype AS constraint_type,
        pg_get_constraintdef(c.oid) AS definition
      FROM pg_constraint c
      JOIN pg_class cl ON cl.oid = c.conrelid
      WHERE cl.relname = 'account'
      ORDER BY conname
    `;

    // Check indexes
    const indexes = await sql`
      SELECT
        indexname,
        indexdef
      FROM pg_indexes
      WHERE tablename = 'account'
      ORDER BY indexname
    `;

    // Check users table email constraint
    const userConstraints = await sql`
      SELECT
        conname AS constraint_name,
        contype AS constraint_type,
        pg_get_constraintdef(c.oid) AS definition
      FROM pg_constraint c
      JOIN pg_class cl ON cl.oid = c.conrelid
      WHERE cl.relname = 'users'
      ORDER BY conname
    `;

    return NextResponse.json({
      accountStructure: accountInfo,
      accountConstraints: constraints,
      accountIndexes: indexes,
      userConstraints: userConstraints,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
