import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const RELAY_URL = 'http://localhost:9997';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = encodeURIComponent(params.id);
    const res = await fetch(`${RELAY_URL}/camera/${id}`, {
      method: 'DELETE',
      signal: AbortSignal.timeout(5000),
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
