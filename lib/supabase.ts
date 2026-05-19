import { createBrowserClient, createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'


//use this in pages and components ('use client' files)
export function createClient() {
  return function createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

//use for API routes and server components
export async function createServerSupabaseClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options}) => 
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}