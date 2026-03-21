import { NextRequest, NextResponse } from 'next/server';
import net from 'net';
import { getAuthenticatedUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

interface PingRequest {
  cameraIp: string;
  port?: number;
}

export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body: PingRequest = await request.json();
    const { cameraIp, port = 554 } = body;

    if (!cameraIp) {
      return NextResponse.json({ error: 'cameraIp is required' }, { status: 400 });
    }

    const active = await pingTcp(cameraIp, port, 1500);
    return NextResponse.json({ active });
  } catch {
    return NextResponse.json({ active: false });
  }
}

function pingTcp(host: string, port: number, timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;

    const done = (ok: boolean) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(ok);
    };

    socket.setTimeout(timeoutMs);
    socket.once('connect', () => done(true));
    socket.once('timeout', () => done(false));
    socket.once('error', () => done(false));

    socket.connect(port, host);
  });
}
