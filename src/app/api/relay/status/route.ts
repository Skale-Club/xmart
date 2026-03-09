import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const res = await fetch('http://localhost:9997/health', {
      signal: AbortSignal.timeout(2000),
    });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json({ online: true, streams: data.streams ?? [] });
    }
    return NextResponse.json({ online: false, streams: [] });
  } catch {
    return NextResponse.json({ online: false, streams: [] });
  }
}
