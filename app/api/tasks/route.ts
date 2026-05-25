import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Helper: gets the authenticated user from the session cookie
// Returns null if nobody is logged in
async function getAuthenticatedUser() {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return { supabase, user }
}

export async function GET(request: NextRequest) {
  const auth = await getAuthenticatedUser()

  // If not logged in, we just reject immediately
  if (!auth) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // Use the session user's id — ignore whatever userId was sent in the URL
  // This means users can only ever fetch their own tasks, to prevent other people from affecting other users' stuff
  const { data, error } = await auth.supabase
    .from('tasks')
    .select('*')
    .eq('user_id', auth.user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedUser()

  if (!auth) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { title, mode, due_date } = await request.json()

  if (!title) {
    return NextResponse.json({ error: 'title is required' }, { status: 400 })
  }

  const { data, error } = await auth.supabase
    .from('tasks')
    .insert({
      user_id: auth.user.id,  // always the logged-in user, never from frontend
      title: title.trim(),
      mode: mode || 'Deep Focus',
      due_date: due_date ?? null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}

export async function PATCH(request: NextRequest) {
  const auth = await getAuthenticatedUser()

  if (!auth) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const body = await request.json()
  const { id, ...updates } = body

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }

  const { data, error } = await auth.supabase
    .from('tasks')
    .update(updates)
    .eq('id', id)
    .eq('user_id', auth.user.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function DELETE(request: NextRequest) {
  const auth = await getAuthenticatedUser()

  if (!auth) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }

  const { error } = await auth.supabase
    .from('tasks')
    .delete()
    .eq('id', id)
    .eq('user_id', auth.user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}