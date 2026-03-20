import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
    const startTime = Date.now()
    const timestamp = new Date().toISOString()

    try {
        const supabaseServer = getSupabaseServerClient()
        const keepaliveSecret = process.env.KEEPALIVE_SECRET
        const authHeader = request.headers.get('authorization')
        const token = authHeader?.startsWith('Bearer ')
            ? authHeader.slice('Bearer '.length)
            : null

        // Validate authentication
        if (!keepaliveSecret || token !== keepaliveSecret) {
            return NextResponse.json({
                ok: false,
                message: 'Unauthorized',
                timestamp
            }, { status: 401 })
        }

        // Perform multiple lightweight queries to ensure database activity
        // This helps prevent Supabase from pausing due to inactivity
        const healthChecks = await Promise.allSettled([
            // Check 1: Devices table
            supabaseServer
                .from('devices')
                .select('id', { head: true, count: 'exact' }),
            // Check 2: Cameras table
            supabaseServer
                .from('cameras')
                .select('id', { head: true, count: 'exact' })
        ])

        const [devicesResult, camerasResult] = healthChecks

        // Extract results
        const devicesCount = devicesResult.status === 'fulfilled'
            ? devicesResult.value.count ?? 0
            : 0
        const camerasCount = camerasResult.status === 'fulfilled'
            ? camerasResult.value.count ?? 0
            : 0

        // Check for errors
        const devicesError = devicesResult.status === 'fulfilled'
            ? devicesResult.value.error
            : devicesResult.reason
        const camerasError = camerasResult.status === 'fulfilled'
            ? camerasResult.value.error
            : camerasResult.reason

        // If both queries failed, return error
        if (devicesError && camerasError) {
            return NextResponse.json({
                ok: false,
                message: 'All database health checks failed',
                errors: {
                    devices: devicesError instanceof Error ? devicesError.message : String(devicesError),
                    cameras: camerasError instanceof Error ? camerasError.message : String(camerasError)
                },
                timestamp,
                responseTimeMs: Date.now() - startTime
            }, { status: 500 })
        }

        // At least one query succeeded - project is active
        const responseTime = Date.now() - startTime

        return NextResponse.json({
            ok: true,
            message: 'Supabase keepalive successful',
            health: {
                devices: {
                    status: !devicesError ? 'healthy' : 'error',
                    count: devicesCount
                },
                cameras: {
                    status: !camerasError ? 'healthy' : 'error',
                    count: camerasCount
                }
            },
            timestamp,
            responseTimeMs: responseTime
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
