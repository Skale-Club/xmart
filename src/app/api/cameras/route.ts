import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET - List all cameras
export async function GET(_request: NextRequest) {
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
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ cameras: data })
  } catch (error) {
    console.error('Error fetching cameras:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cameras' },
      { status: 500 }
    )
  }
}

// POST - Create a new camera
export async function POST(request: NextRequest) {
  try {
    const { supabase, user, error: authError } = await getAuthenticatedUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, ip, username, password, stream = 'stream1' } = body

    if (!name || !ip || !username || !password) {
      return NextResponse.json(
        { error: 'Missing required fields: name, ip, username, password' },
        { status: 400 }
      )
    }

    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/
    if (!ipRegex.test(ip)) {
      return NextResponse.json(
        { error: 'Invalid IP address format' },
        { status: 400 }
      )
    }

    if (stream !== 'stream1' && stream !== 'stream2') {
      return NextResponse.json(
        { error: 'Stream must be either "stream1" or "stream2"' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('cameras')
      .insert([
        {
          user_id: user.id,
          name,
          ip,
          username,
          password,
          stream,
          enabled: true,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ camera: data }, { status: 201 })
  } catch (error) {
    console.error('Error creating camera:', error)
    return NextResponse.json(
      { error: 'Failed to create camera' },
      { status: 500 }
    )
  }
}
