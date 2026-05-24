import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

//server side supabase client
export async function createServerSupabaseClient() {
  //stores login session in cookies
  const cookieStore = await cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      //configuring cookies (tell supabase how to read/write cookies)
      cookies: {
        //read cookies
        getAll() { return cookieStore.getAll() },
        //write cookies
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}