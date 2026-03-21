import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase-admin'

export async function GET() {
    try {
        const supabase = getSupabaseAdminClient()

        const { error } = await supabase.from('profiles').select('id').limit(1)

        if (error) {
            return NextResponse.json({
                status: 'error',
                message: 'Connected to Supabase, but schema is not ready yet.',
                error: error.message,
                project: 'nevdmnluvegwmjmgmjef',
            }, { status: 500 })
        }

        return NextResponse.json({
            status: 'connected',
            message: 'Successfully connected to Supabase with the current schema.',
            project: 'nevdmnluvegwmjmgmjef'
        })
    } catch (err) {
        return NextResponse.json({
            status: 'error',
            message: 'Failed to connect to Supabase',
            error: err instanceof Error ? err.message : 'Unknown error'
        }, { status: 500 })
    }
}
