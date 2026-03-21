import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { getRelayStatus } from '@/lib/relay-server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const data = getRelayStatus();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ online: false, streams: [] });
  }
}
