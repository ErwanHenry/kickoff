import { NextRequest, NextResponse } from 'next/server';
import { generateTeams } from '@/lib/actions/teams';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await generateTeams(body);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('API /teams error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
