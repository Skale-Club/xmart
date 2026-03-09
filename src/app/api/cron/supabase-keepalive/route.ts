import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
    try {
        const keepaliveSecret = process.env.KEEPALIVE_SECRET
        const authHeader = request.headers.get('authorization')
        const token = authHeader?.startsWith('Bearer ')
            ? authHeader.slice('Bearer '.length)
            : null

        if (!keepaliveSecret || token !== keepaliveSecret) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Lightweight query to keep the project active with minimal DB work.
        const { error } = await supabaseServer
            .from('devices')
            .select('id', { head: true, count: 'exact' })

        if (error) {
            return NextResponse.json({
                ok: false,
                message: 'Supabase keepalive failed',
                error: error.message
            }, { status: 500 })
        }

        return NextResponse.json({
            ok: true,
            message: 'Supabase keepalive successful',
            timestamp: new Date().toISOString()
        })
    } catch (error) {
        return NextResponse.json({
            ok: false,
            message: 'Unexpected keepalive error',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}
