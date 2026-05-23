import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Remind me to remove this when our app is done
const TEMP_USER_ID = 'b242fc90-dd7f-433f-8fd0-958b4e9f8f6c'

// For fetching all the tasks of that specific user
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId') ?? TEMP_USER_ID

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// When user adds a task
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { userId, title, mode } = await request.json()
  const effectiveUserId = userId ?? TEMP_USER_ID

  if (!effectiveUserId || !title) {
    return NextResponse.json(
      { error: 'userId and title are required' },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      user_id: effectiveUserId,
      title: title.trim(),
      mode: mode || 'Deep Focus',
    })
    .select()
    .single()  

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}

// When the user ticks/unticks the checkbox for done or not
export async function PATCH(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const body = await request.json()
  const { id, ...updates } = body

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('tasks')
    .update(updates)   
    .eq('id', id) 
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// For user's deletion of tasks
export async function DELETE(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}