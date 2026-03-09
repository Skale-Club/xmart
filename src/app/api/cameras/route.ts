import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

function getOwnerId(request: NextRequest): string | null {
  const ownerId = request.headers.get('x-camera-owner');
  if (!ownerId) return null;

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(ownerId) ? ownerId : null;
}

// GET - List all cameras
export async function GET(request: NextRequest) {
  try {
    const ownerId = getOwnerId(request);
    if (!ownerId) {
      return NextResponse.json(
        { error: 'Missing or invalid x-camera-owner header' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServerClient();

    const { data, error } = await supabase
      .from('cameras')
      .select('*')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ cameras: data });
  } catch (error) {
    console.error('Error fetching cameras:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cameras' },
      { status: 500 }
    );
  }
}

// POST - Create a new camera
export async function POST(request: NextRequest) {
  try {
    const ownerId = getOwnerId(request);
    if (!ownerId) {
      return NextResponse.json(
        { error: 'Missing or invalid x-camera-owner header' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServerClient();

    const body = await request.json();
    const { name, ip, username, password, stream = 'stream1' } = body;

    // Validate required fields
    if (!name || !ip || !username || !password) {
      return NextResponse.json(
        { error: 'Missing required fields: name, ip, username, password' },
        { status: 400 }
      );
    }

    // Validate IP format
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(ip)) {
      return NextResponse.json(
        { error: 'Invalid IP address format' },
        { status: 400 }
      );
    }

    // Validate stream type
    if (stream !== 'stream1' && stream !== 'stream2') {
      return NextResponse.json(
        { error: 'Stream must be either "stream1" or "stream2"' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('cameras')
      .insert([
        {
          owner_id: ownerId,
          name,
          ip,
          username,
          password,
          stream,
          enabled: true,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ camera: data }, { status: 201 });
  } catch (error) {
    console.error('Error creating camera:', error);
    return NextResponse.json(
      { error: 'Failed to create camera' },
      { status: 500 }
    );
  }
}
