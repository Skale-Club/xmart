import { getSupabaseServerClient } from '@/lib/supabase-server'

export async function getAuthenticatedUser() {
    const supabase = await getSupabaseServerClient()
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser()

    return { supabase, user, error }
}
