import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export const dynamic = 'force-dynamic';

const RELAY_URL = 'http://localhost:9997';

type RelayGlobal = typeof globalThis & {
  __relayStartingPromise?: Promise<void>;
};

async function isRelayRunning(): Promise<boolean> {
  try {
    const res = await fetch(`${RELAY_URL}/health`, {
      signal: AbortSignal.timeout(2000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function ensureRelayRunning(): Promise<void> {
  if (await isRelayRunning()) return;

  const g = globalThis as RelayGlobal;
  if (!g.__relayStartingPromise) {
    g.__relayStartingPromise = (async () => {
      const serverPath = path.join(process.cwd(), 'server', 'rtsp-websocket-server.js');
      const child = spawn('node', [serverPath], {
        detached: true,
        stdio: 'ignore',
        windowsHide: true,
        shell: false,
      });
      child.unref();

      for (let i = 0; i < 20; i++) {
        await new Promise((r) => setTimeout(r, 500));
        if (await isRelayRunning()) return;
      }

      throw new Error('Relay did not start in time');
    })().finally(() => {
      delete g.__relayStartingPromise;
    });
  }

  await g.__relayStartingPromise;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    await ensureRelayRunning();

    const res = await fetch(`${RELAY_URL}/camera`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(12000),
    });

    const text = await res.text();
    let data: any = {};
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = { message: text };
      }
    }
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? 'Could not reach relay server' },
      { status: 503 }
    );
  }
}
