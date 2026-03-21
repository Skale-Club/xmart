import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { ensureRelayRunning } from '@/lib/relay-server';

export const dynamic = 'force-dynamic';

export async function POST() {
  const { user, error: authError } = await getAuthenticatedUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const { started } = ensureRelayRunning();
    return NextResponse.json({ status: started ? 'started' : 'already_running' });
  } catch (e: any) {
    return NextResponse.json({ status: 'failed', error: e.message }, { status: 500 });
  }
}
