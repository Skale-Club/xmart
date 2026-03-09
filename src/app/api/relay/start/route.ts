import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export const dynamic = 'force-dynamic';

async function isRelayRunning(): Promise<boolean> {
  try {
    const res = await fetch('http://localhost:9997/health', {
      signal: AbortSignal.timeout(2000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

type RelayGlobal = typeof globalThis & {
  __relayStartingPromise?: Promise<void>;
};

async function ensureRelayRunning(): Promise<boolean> {
  if (await isRelayRunning()) return false;

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

      throw new Error('Server started but did not respond in time.');
    })().finally(() => {
      delete g.__relayStartingPromise;
    });
  }

  await g.__relayStartingPromise;
  return true;
}

export async function POST() {
  // Already running?
  if (await isRelayRunning()) {
    return NextResponse.json({ status: 'already_running' });
  }

  try {
    await ensureRelayRunning();
    return NextResponse.json({ status: 'started' });
  } catch (e: any) {
    return NextResponse.json({ status: 'failed', error: e.message }, { status: 500 });
  }
}
