import { getUserRole } from '@/lib/auth/get-user-role'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export interface ContactMessageSummary {
  id: string
  userId: string | null
  userEmail: string
  userName: string | null
  subject: string | null
  message: string
  status: string
  adminNotes: string | null
  createdAt: string
  updatedAt: string
}

type ContactMessageRow = {
  id: string
  user_id: string | null
  user_email: string
  user_name: string | null
  subject: string | null
  message: string
  status: string | null
  admin_notes: string | null
  created_at: string | null
  updated_at: string | null
}

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function toSummary(row: ContactMessageRow): ContactMessageSummary {
  return {
    id: row.id,
    userId: row.user_id ?? null,
    userEmail: normalizeText(row.user_email),
    userName: normalizeText(row.user_name) || null,
    subject: normalizeText(row.subject) || null,
    message: normalizeText(row.message),
    status: normalizeText(row.status) || 'pending',
    adminNotes: normalizeText(row.admin_notes) || null,
    createdAt: row.created_at ?? '',
    updatedAt: row.updated_at ?? row.created_at ?? '',
  }
}

async function getAdminSupabase() {
  return createAdminClient() ?? (await createClient())
}

export async function createContactMessage(input: {
  subject?: string | null
  message: string
}) {
  const { user } = await getUserRole()

  if (!user?.email) {
    return {
      ok: false as const,
      code: 'UNAUTHORIZED',
      message: 'Please log in to send us a message.',
    }
  }

  const supabase = await createClient()
  const subject = normalizeText(input.subject) || null
  const message = normalizeText(input.message)

  if (!message) {
    return {
      ok: false as const,
      code: 'VALIDATION_ERROR',
      message: 'Message is required.',
    }
  }

  const { data: profile } = await supabase
    .from('customer_profiles')
    .select('first_name, last_name, full_name')
    .eq('user_id', user.id)
    .maybeSingle()

  const userName =
    normalizeText(profile?.full_name) ||
    [normalizeText(profile?.first_name), normalizeText(profile?.last_name)].filter(Boolean).join(' ') ||
    null

  const { data, error } = await supabase
    .from('contact_messages')
    .insert({
      user_id: user.id,
      user_email: user.email,
      user_name: userName,
      subject,
      message,
      status: 'pending',
    })
    .select('*')
    .single()

  if (error) {
    console.error('[contact-messages] Failed to create message', error)
    return {
      ok: false as const,
      code: 'DATABASE_ERROR',
      message: error.message || 'We could not send your message.',
    }
  }

  return {
    ok: true as const,
    data: toSummary(data as ContactMessageRow),
  }
}

export async function listPendingContactMessages() {
  const supabase = await getAdminSupabase()
  const { data, error } = await supabase
    .from('contact_messages')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(20)

  if (error && error.code !== '42P01' && error.code !== 'PGRST205') {
    console.error('[contact-messages] Failed to load pending messages', error)
    return {
      ok: false as const,
      message: 'We could not load contact messages right now.',
      data: [] as ContactMessageSummary[],
    }
  }

  return {
    ok: true as const,
    data: ((data ?? []) as ContactMessageRow[]).map(toSummary),
  }
}

export async function updateContactMessage(id: string, input: {
  status?: string
  adminNotes?: string | null
}) {
  const { user, role } = await getUserRole()

  if (!user || role !== 'admin') {
    return {
      ok: false as const,
      code: 'FORBIDDEN',
      message: 'Only admins can update contact messages.',
    }
  }

  const supabase = await getAdminSupabase()
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (input.status !== undefined) {
    updates.status = normalizeText(input.status) || 'pending'
  }

  if (input.adminNotes !== undefined) {
    updates.admin_notes = normalizeText(input.adminNotes) || null
  }

  const { data, error } = await supabase
    .from('contact_messages')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    console.error('[contact-messages] Failed to update message', error)
    return {
      ok: false as const,
      code: 'DATABASE_ERROR',
      message: error.message || 'We could not update this contact message.',
    }
  }

  return {
    ok: true as const,
    data: toSummary(data as ContactMessageRow),
  }
}
