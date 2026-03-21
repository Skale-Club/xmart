import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

function getSupabaseServerConfig() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Missing Supabase environment variables for authenticated server client.')
    }

    return { supabaseUrl, supabaseAnonKey }
}

export async function getSupabaseServerClient() {
    const cookieStore = await cookies()
    const { supabaseUrl, supabaseAnonKey } = getSupabaseServerConfig()

    return createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
            getAll() {
                return cookieStore.getAll()
            },
            setAll(cookiesToSet) {
                try {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        cookieStore.set(name, value, options)
                    })
                } catch {
                    // Server Components cannot set cookies directly; middleware handles refreshes.
                }
            },
        },
    })
}
