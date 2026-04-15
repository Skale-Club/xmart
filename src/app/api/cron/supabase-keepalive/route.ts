import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSupabaseAdminClient } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
    const startTime = Date.now()
    const timestamp = new Date().toISOString()

    try {
        const keepaliveSecret = process.env.KEEPALIVE_SECRET
        const authHeader = request.headers.get('authorization')
        const token = authHeader?.startsWith('Bearer ')
            ? authHeader.slice('Bearer '.length)
            : null

        if (!keepaliveSecret || token !== keepaliveSecret) {
            return NextResponse.json({
                ok: false,
                message: 'Unauthorized',
                timestamp
            }, { status: 401 })
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

        if (!supabaseUrl || !supabaseAnonKey) {
            return NextResponse.json({
                ok: false,
                message: 'Missing Supabase public env vars',
                timestamp
            }, { status: 500 })
        }

        // Use anon key to mimic public user traffic — Supabase's inactivity
        // detector tracks public API Gateway requests, not service_role calls.
        const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
            auth: { autoRefreshToken: false, persistSession: false },
        })
        const adminClient = getSupabaseAdminClient()

        // Real row-returning SELECTs (not HEAD-only) via anon key.
        const [devicesAnon, camerasAnon] = await Promise.allSettled([
            anonClient.from('devices').select('id').limit(1),
            anonClient.from('cameras').select('id').limit(1),
        ])

        // Real write to a dedicated keepalive table via admin (RLS bypass),
        // and an anon read-back so the public API sees traffic both ways.
        const pingedAt = new Date().toISOString()
        const writeResult = await adminClient
            .from('keepalive_pings')
            .insert({ source: 'github-actions', pinged_at: pingedAt })
            .select('id')
            .single()

        const readBack = await anonClient
            .from('keepalive_pings')
            .select('id, pinged_at')
            .order('pinged_at', { ascending: false })
            .limit(1)

        const devicesOk = devicesAnon.status === 'fulfilled' && !devicesAnon.value.error
        const camerasOk = camerasAnon.status === 'fulfilled' && !camerasAnon.value.error
        const writeOk = !writeResult.error
        const readOk = !readBack.error

        // Success if at least one public read worked — write is best-effort
        // (the keepalive_pings table may not exist yet on first deploy).
        if (!devicesOk && !camerasOk && !readOk) {
            return NextResponse.json({
                ok: false,
                message: 'All keepalive reads failed',
                details: {
                    devices: devicesAnon.status === 'fulfilled'
                        ? devicesAnon.value.error?.message
                        : String(devicesAnon.reason),
                    cameras: camerasAnon.status === 'fulfilled'
                        ? camerasAnon.value.error?.message
                        : String(camerasAnon.reason),
                    write: writeResult.error?.message,
                    read: readBack.error?.message,
                },
                timestamp,
                responseTimeMs: Date.now() - startTime,
            }, { status: 500 })
        }

        return NextResponse.json({
            ok: true,
            message: 'Supabase keepalive successful',
            checks: {
                devicesAnonRead: devicesOk,
                camerasAnonRead: camerasOk,
                keepalivePingWrite: writeOk,
                keepalivePingRead: readOk,
            },
            writeError: writeResult.error?.message,
            readError: readBack.error?.message,
            timestamp,
            responseTimeMs: Date.now() - startTime,
        })
    } catch (error) {
        return NextResponse.json({
            ok: false,
            message: 'Unexpected keepalive error',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp,
            responseTimeMs: Date.now() - startTime
        }, { status: 500 })
    }
}
