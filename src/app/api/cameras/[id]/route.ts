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

// GET - Get single camera
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      .eq('id', params.id)
      .eq('owner_id', ownerId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Camera not found' }, { status: 404 });
      }
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ camera: data });
  } catch (error) {
    console.error('Error fetching camera:', error);
    return NextResponse.json(
      { error: 'Failed to fetch camera' },
      { status: 500 }
    );
  }
}

// PUT - Update camera
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const { name, ip, username, password, stream, enabled } = body;

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (ip !== undefined) {
      // Validate IP format
      const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
      if (!ipRegex.test(ip)) {
        return NextResponse.json(
          { error: 'Invalid IP address format' },
          { status: 400 }
        );
      }
      updates.ip = ip;
    }
    if (username !== undefined) updates.username = username;
    if (password !== undefined) updates.password = password;
    if (stream !== undefined) {
      if (stream !== 'stream1' && stream !== 'stream2') {
        return NextResponse.json(
          { error: 'Stream must be either "stream1" or "stream2"' },
          { status: 400 }
        );
      }
      updates.stream = stream;
    }
    if (enabled !== undefined) updates.enabled = enabled;

    const { data, error } = await supabase
      .from('cameras')
      .update(updates)
      .eq('id', params.id)
      .eq('owner_id', ownerId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Camera not found' }, { status: 404 });
      }
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ camera: data });
  } catch (error) {
    console.error('Error updating camera:', error);
    return NextResponse.json(
      { error: 'Failed to update camera' },
      { status: 500 }
    );
  }
}

// DELETE - Delete camera
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ownerId = getOwnerId(request);
    if (!ownerId) {
      return NextResponse.json(
        { error: 'Missing or invalid x-camera-owner header' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServerClient();

    const { error } = await supabase
      .from('cameras')
      .delete()
      .eq('id', params.id)
      .eq('owner_id', ownerId);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Camera deleted successfully' });
  } catch (error) {
    console.error('Error deleting camera:', error);
    return NextResponse.json(
      { error: 'Failed to delete camera' },
      { status: 500 }
    );
  }
}
