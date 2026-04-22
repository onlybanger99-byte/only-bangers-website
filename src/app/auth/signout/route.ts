import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error('[auth/signout] Failed to sign out:', error)
  }

  return NextResponse.redirect(new URL('/login', request.url))
}
