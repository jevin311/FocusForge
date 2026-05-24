import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server' //use for redirect

//run when /auth/callback is called
export async function GET(request: Request) {
    //searchParams read query after auth/callback...
    //origin will be the domain e.g http://localhost:3000
    const { searchParams, origin } = new URL(request.url)
    //temp code
    const code = searchParams.get('code')

    if (code) {
        const supabase = await createServerSupabaseClient()
        //convert temp code for real login session
        await supabase.auth.exchangeCodeForSession(code)
    }

    //redirect to dashboard
    return NextResponse.redirect(`${origin}/dashboard`)
}