import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server' //use for redirect

//run when /auth/callback is called
export async function GET(request: Request) {
    //searchParams read query after auth/callback...
    //origin will be the domain e.g http://localhost:3000
    const { searchParams, origin } = new URL(request.url)
    //temp code
    const code = searchParams.get('code')
    const type = searchParams.get('type')

    if (code) {
        const supabase = await createServerSupabaseClient()
        //convert temp code for real login session
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            // check what type of flow this is
            // for email verification, redirect to login
            // for password reset, redirect to reset-password
            if (type === 'recovery') {
                return NextResponse.redirect(`${origin}/reset-password`)
            }
            if (type === 'google') {
                return NextResponse.redirect(`${origin}/dashboard?login=google`)
            }
            //for normal email verification, go to login
            return NextResponse.redirect(`${origin}/?verified=true`)
        }
    }

    //redirect to dashboard
    return NextResponse.redirect(`${origin}/?error=auth`)
}