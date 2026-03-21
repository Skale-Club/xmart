import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET - Get single camera
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { supabase, user, error: authError } = await getAuthenticatedUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { data, error } = await supabase
      .from('cameras')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Camera not found' }, { status: 404 })
      }
      console.error('Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ camera: data })
  } catch (error) {
    console.error('Error fetching camera:', error)
    return NextResponse.json(
      { error: 'Failed to fetch camera' },
      { status: 500 }
    )
  }
}

// PUT - Update camera
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { supabase, user, error: authError } = await getAuthenticatedUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, ip, username, password, stream, enabled } = body

    const updates: Record<string, unknown> = {}
    if (name !== undefined) updates.name = name
    if (ip !== undefined) {
      const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/
      if (!ipRegex.test(ip)) {
        return NextResponse.json(
          { error: 'Invalid IP address format' },
          { status: 400 }
        )
      }
      updates.ip = ip
    }
    if (username !== undefined) updates.username = username
    if (password !== undefined) updates.password = password
    if (stream !== undefined) {
      if (stream !== 'stream1' && stream !== 'stream2') {
        return NextResponse.json(
          { error: 'Stream must be either "stream1" or "stream2"' },
          { status: 400 }
        )
      }
      updates.stream = stream
    }
    if (enabled !== undefined) updates.enabled = enabled

    const { data, error } = await supabase
      .from('cameras')
      .update(updates)
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Camera not found' }, { status: 404 })
      }
      console.error('Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ camera: data })
  } catch (error) {
    console.error('Error updating camera:', error)
    return NextResponse.json(
      { error: 'Failed to update camera' },
      { status: 500 }
    )
  }
}

// DELETE - Delete camera
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { supabase, user, error: authError } = await getAuthenticatedUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { error } = await supabase
      .from('cameras')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Camera deleted successfully' })
  } catch (error) {
    console.error('Error deleting camera:', error)
    return NextResponse.json(
      { error: 'Failed to delete camera' },
      { status: 500 }
    )
  }
}
